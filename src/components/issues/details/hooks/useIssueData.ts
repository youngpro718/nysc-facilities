
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
        lighting_fixtures: data.lighting_fixtures || [],
        recurring_pattern: data.recurring_pattern ? {
          is_recurring: data.recurring_pattern.is_recurring || false,
          frequency: data.recurring_pattern.frequency,
          pattern_confidence: data.recurring_pattern.pattern_confidence
        } : {
          is_recurring: false
        },
        maintenance_requirements: data.maintenance_requirements ? {
          scheduled: data.maintenance_requirements.scheduled || false,
          frequency: data.maintenance_requirements.frequency,
          next_due: data.maintenance_requirements.next_due
        } : {
          scheduled: false
        },
        lighting_details: data.lighting_details || {
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
