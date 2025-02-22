
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

      const transformedData = {
        ...data,
        lighting_fixtures: data.lighting_fixtures ? [data.lighting_fixtures] : []
      } as Issue;

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

