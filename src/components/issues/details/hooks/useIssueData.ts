
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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

      // Transform the data to match our Issue type
      const transformedData: Issue = {
        ...data,
        lighting_fixtures: Array.isArray(data.lighting_fixtures) ? data.lighting_fixtures.map(fixture => ({
          name: fixture.name,
          type: fixture.type,
          status: fixture.status,
          position: fixture.position,
          electrical_issues: fixture.electrical_issues || {}
        })) : [],
        recurring_pattern: {
          is_recurring: Boolean(getJsonObject(data.recurring_pattern).is_recurring),
          frequency: getJsonObject(data.recurring_pattern).frequency,
          pattern_confidence: getJsonObject(data.recurring_pattern).pattern_confidence
        },
        maintenance_requirements: {
          scheduled: Boolean(getJsonObject(data.maintenance_requirements).scheduled),
          frequency: getJsonObject(data.maintenance_requirements).frequency,
          next_due: getJsonObject(data.maintenance_requirements).next_due
        },
        lighting_details: {
          fixture_status: getJsonObject(data.lighting_details).fixture_status,
          detected_issues: Array.isArray(getJsonObject(data.lighting_details).detected_issues) 
            ? getJsonObject(data.lighting_details).detected_issues 
            : [],
          maintenance_history: Array.isArray(getJsonObject(data.lighting_details).maintenance_history) 
            ? getJsonObject(data.lighting_details).maintenance_history 
            : []
        }
      };

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
