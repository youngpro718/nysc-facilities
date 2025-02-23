
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCallback } from "react";
import { toast } from "sonner";
import { IssueError } from "./types/errors";
import type { UserIssue } from "@/types/dashboard";

export const useUserIssues = (userId?: string) => {
  const queryClient = useQueryClient();

  const { data: userIssues = [], refetch: refetchIssues } = useQuery<UserIssue[]>({
    queryKey: ['userIssues', userId],
    queryFn: async () => {
      try {
        if (!userId) throw new IssueError('No user ID available');
        const { data, error } = await supabase
          .from('issues')
          .select(`
            id,
            title,
            description,
            status,
            created_at,
            priority,
            building_id,
            seen,
            photos,
            rooms (
              id,
              name,
              room_number
            ),
            buildings (
              name
            ),
            floors (
              name
            )
          `)
          .eq('created_by', userId)
          .order('created_at', { ascending: false });

        if (error) throw new IssueError(`Failed to fetch user issues: ${error.message}`);
        if (!data) throw new IssueError('No issues data returned');
        return data;
      } catch (error) {
        console.error('Error fetching user issues:', error);
        throw new IssueError(error instanceof Error ? error.message : 'Failed to fetch user issues');
      }
    },
    enabled: !!userId,
    staleTime: 30000,
  });

  const handleMarkAsSeen = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('issues')
        .update({ seen: true })
        .eq('id', id);

      if (error) throw new IssueError(`Failed to mark issue as seen: ${error.message}`);

      queryClient.setQueryData(['userIssues', userId], (old: UserIssue[] | undefined) =>
        old?.map(issue =>
          issue.id === id ? { ...issue, seen: true } : issue
        )
      );
      toast.success('Issue marked as seen');
    } catch (error) {
      console.error('Error marking issue as seen:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to mark issue as seen');
    }
  }, [queryClient, userId]);

  return { userIssues, handleMarkAsSeen, refetchIssues };
};
