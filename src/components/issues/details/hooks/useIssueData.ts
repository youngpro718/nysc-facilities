
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
          is_recurring: typeof data.recurring_pattern === 'object' && data.recurring_pattern ? 
            Boolean(data.recurring_pattern.is_recurring) : false,
          frequency: typeof data.recurring_pattern === 'object' && data.recurring_pattern ? 
            data.recurring_pattern.frequency : undefined,
          pattern_confidence: typeof data.recurring_pattern === 'object' && data.recurring_pattern ? 
            data.recurring_pattern.pattern_confidence : undefined
        },
        maintenance_requirements: {
          scheduled: typeof data.maintenance_requirements === 'object' && data.maintenance_requirements ? 
            Boolean(data.maintenance_requirements.scheduled) : false,
          frequency: typeof data.maintenance_requirements === 'object' && data.maintenance_requirements ? 
            data.maintenance_requirements.frequency : undefined,
          next_due: typeof data.maintenance_requirements === 'object' && data.maintenance_requirements ? 
            data.maintenance_requirements.next_due : undefined
        },
        lighting_details: typeof data.lighting_details === 'object' && data.lighting_details ? {
          fixture_status: data.lighting_details.fixture_status,
          detected_issues: Array.isArray(data.lighting_details.detected_issues) ? 
            data.lighting_details.detected_issues : [],
          maintenance_history: Array.isArray(data.lighting_details.maintenance_history) ? 
            data.lighting_details.maintenance_history : []
        } : {
          fixture_status: undefined,
          detected_issues: [],
          maintenance_history: []
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
