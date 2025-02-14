
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Issue, FixtureType, FixtureStatus, FixturePosition, ImpactLevel } from "../../types/IssueTypes";
import { toast } from "sonner";

interface RawLightingFixture {
  name: string;
  type: FixtureType;
  status: FixtureStatus;
  position: FixturePosition;
  electrical_issues: Record<string, any>;
}

export function useIssueDetails(issueId: string | null) {
  const queryClient = useQueryClient();

  const { data: issue, isLoading: issueLoading } = useQuery({
    queryKey: ['issues', issueId],
    queryFn: async () => {
      if (!issueId) return null;
      const { data, error } = await supabase
        .from('issues')
        .select(`
          *,
          buildings(name),
          floors(name),
          rooms(name),
          lighting_fixtures(
            name,
            type,
            status,
            position,
            electrical_issues
          )
        `)
        .eq('id', issueId)
        .single();

      if (error) throw error;

      const transformLightingFixtures = (fixtures: RawLightingFixture[] | null): LightingFixture[] => {
        if (!fixtures || !Array.isArray(fixtures)) return [];
        return fixtures.map(fixture => ({
          name: fixture.name,
          type: fixture.type as FixtureType,
          status: fixture.status as FixtureStatus,
          position: fixture.position as FixturePosition,
          electrical_issues: fixture.electrical_issues ? {
            short_circuit: fixture.electrical_issues.short_circuit || false,
            wiring_issues: fixture.electrical_issues.wiring_issues || false,
            voltage_problems: fixture.electrical_issues.voltage_problems || false,
            ballast_issue: fixture.electrical_issues.ballast_issue || false
          } : undefined
        }));
      };

      const transformedData: Issue = {
        ...data,
        lighting_fixtures: transformLightingFixtures(Array.isArray(data.lighting_fixtures) ? data.lighting_fixtures : null),
        recurring_pattern: data.recurring_pattern && typeof data.recurring_pattern === 'object' ? {
          is_recurring: Boolean((data.recurring_pattern as any).is_recurring),
          frequency: String((data.recurring_pattern as any).frequency || ''),
          last_occurrence: String((data.recurring_pattern as any).last_occurrence || ''),
          pattern_confidence: Number((data.recurring_pattern as any).pattern_confidence || 0)
        } : undefined,
        maintenance_requirements: data.maintenance_requirements && typeof data.maintenance_requirements === 'object' ? {
          scheduled: Boolean((data.maintenance_requirements as any).scheduled),
          frequency: String((data.maintenance_requirements as any).frequency || ''),
          last_maintenance: String((data.maintenance_requirements as any).last_maintenance || ''),
          next_due: String((data.maintenance_requirements as any).next_due || '')
        } : undefined,
        impact_level: (data.impact_level as ImpactLevel) || 'minimal',
      };

      return transformedData;
    },
    enabled: !!issueId
  });

  const markAsSeenMutation = useMutation({
    mutationFn: async () => {
      if (!issueId) return;
      const { error } = await supabase
        .from('issues')
        .update({ seen: true })
        .eq('id', issueId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues', issueId] });
      toast.success("Issue marked as seen");
    },
    onError: () => {
      toast.error("Failed to mark issue as seen");
    }
  });

  return {
    issue,
    issueLoading,
    markAsSeenMutation
  };
}
