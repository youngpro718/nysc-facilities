
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
          buildings:building_id(name),
          floors:floor_id(name),
          rooms:room_id(name, room_number),
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
      const getJsonObject = (json: unknown): any => {
        return typeof json === 'object' && json !== null ? json as any : {};
      };

      // Cache JSON object lookups to avoid repeated parsing
      const rawData = data as Record<string, unknown>;
      const recurringPattern = getJsonObject(rawData.recurring_pattern || {});
      const maintenanceReqs = getJsonObject(rawData.maintenance_requirements || {});
      const lightingDetails = getJsonObject(rawData.lighting_details || {});

      // Transform the data with type assertion
      const transformedData = {
        ...data,
        assigned_to: (data as any).assigned_to as "DCAS" | "OCA" | "Self" | "Outside_Vendor",
        buildings: (data as any).buildings,
        floors: (data as any).floors,
        rooms: (data as any).rooms
          ? { name: (data as any).rooms.name, room_number: (data as any).rooms.room_number }
          : undefined,
        lighting_fixtures: Array.isArray((data as any).lighting_fixtures)
          ? (data as any).lighting_fixtures.map((fixture: any) => ({
              name: fixture.name,
              type: fixture.type,
              status: fixture.status,
              position: fixture.position,
              electrical_issues: fixture.electrical_issues || {}
            }))
          : [],
        recurring_pattern: {
          is_recurring: Boolean(recurringPattern.is_recurring),
          frequency: recurringPattern.frequency,
          pattern_confidence: recurringPattern.pattern_confidence
        },
        maintenance_requirements: {
          scheduled: Boolean(maintenanceReqs.scheduled),
          frequency: maintenanceReqs.frequency,
          next_due: maintenanceReqs.next_due
        },
        lighting_details: {
          fixture_status: lightingDetails.fixture_status,
          detected_issues: Array.isArray(lightingDetails.detected_issues)
            ? lightingDetails.detected_issues
            : [],
          maintenance_history: Array.isArray(lightingDetails.maintenance_history)
            ? lightingDetails.maintenance_history
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
