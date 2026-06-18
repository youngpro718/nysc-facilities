
import { useQuery } from "@tanstack/react-query";
import { logger } from '@/lib/logger';
import { supabase } from "@/lib/supabase";
import { IssueError } from "./types/errors";
import type { UserIssue } from "@/types/dashboard";
import { QUERY_CONFIG } from '@/config';

export const useAdminIssues = () => {
  const { data: allIssues = [] } = useQuery<UserIssue[]>({
    queryKey: ['allIssues'],
    queryFn: async () => {
      try {
        // The admin dashboard widget displays at most 50 issues. limit(500)
        // was a leftover from the old admin index and just bloated payloads.
        const { data, error } = await supabase
          .from('issues')
          .select(`
            id, title, description, status, priority, created_at,
            building_id, room_id, seen, issue_type, assigned_to, photos,
            rooms:room_id (room_number, name)
          `)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw new IssueError(`Failed to fetch all issues: ${error.message}`);
        if (!data) throw new IssueError('No issues data returned');
        return data;
      } catch (error) {
        logger.warn('Error fetching all issues:', error);
        throw new IssueError(error instanceof Error ? error.message : 'Failed to fetch all issues');
      }
    },
    staleTime: QUERY_CONFIG.stale.realtime,
  });

  return { allIssues };
};
