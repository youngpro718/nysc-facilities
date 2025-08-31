
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Issue } from "../../types/IssueTypes";
import { TimelineEvent } from "../types/TimelineTypes";

export const useIssueData = (issueId: string | null) => {
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

      // Helper function to safely check object properties
      const getJsonObject = (json: unknown): Record<string, any> => {
        return typeof json === 'object' && json !== null ? json : {};
      };

      // Transform the data with type assertion
      const transformedData = {
        ...data,
        assigned_to: (data as any).assigned_to as "DCAS" | "OCA" | "Self" | "Outside_Vendor",
        buildings: (data as any).buildings,
        floors: (data as any).floors,
        rooms: (data as any).rooms ? { name: (data as any).rooms.name } : undefined,
        lighting_fixtures: Array.isArray((data as any).lighting_fixtures) ? (data as any).lighting_fixtures.map((fixture: any) => ({
          name: fixture.name,
          type: fixture.type,
          status: fixture.status,
          position: fixture.position,
          electrical_issues: fixture.electrical_issues || {}
        })) : [],
        recurring_pattern: {
          is_recurring: Boolean(getJsonObject((data as any).recurring_pattern || {}).is_recurring),
          frequency: getJsonObject((data as any).recurring_pattern || {}).frequency,
          pattern_confidence: getJsonObject((data as any).recurring_pattern || {}).pattern_confidence
        },
        maintenance_requirements: {
          scheduled: Boolean(getJsonObject((data as any).maintenance_requirements || {}).scheduled),
          frequency: getJsonObject((data as any).maintenance_requirements || {}).frequency,
          next_due: getJsonObject((data as any).maintenance_requirements || {}).next_due
        },
        lighting_details: {
          fixture_status: getJsonObject((data as any).lighting_details || {}).fixture_status,
          detected_issues: Array.isArray(getJsonObject((data as any).lighting_details || {}).detected_issues) 
            ? getJsonObject((data as any).lighting_details || {}).detected_issues 
            : [],
          maintenance_history: Array.isArray(getJsonObject((data as any).lighting_details || {}).maintenance_history) 
            ? getJsonObject((data as any).lighting_details || {}).maintenance_history 
            : []
        }
      } as unknown as Issue;

      return transformedData;
    },
    enabled: !!issueId
  });

  const { data: timeline, isLoading: timelineLoading } = useQuery({
    queryKey: ['issue-timeline', issueId],
    queryFn: async () => {
      if (!issueId) return [];
      const { data, error } = await supabase
        .from('issue_history')
        .select('*')
        .eq('issue_id', issueId)
        .order('performed_at', { ascending: false });

      if (error) throw error;
      return data as TimelineEvent[];
    },
    enabled: !!issueId
  });

  return {
    issue,
    issueLoading,
    timeline,
    timelineLoading
  };
};
