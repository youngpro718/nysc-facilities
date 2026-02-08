
import { useQuery } from "@tanstack/react-query";
import { logger } from '@/lib/logger';
import { supabase } from "@/lib/supabase";
import { IssueError } from "./types/errors";
import type { UserIssue } from "@/types/dashboard";

export const useAdminIssues = () => {
  const { data: allIssues = [] } = useQuery<UserIssue[]>({
    queryKey: ['allIssues'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('issues')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw new IssueError(`Failed to fetch all issues: ${error.message}`);
        if (!data) throw new IssueError('No issues data returned');
        return data;
      } catch (error) {
        logger.error('Error fetching all issues:', error);
        throw new IssueError(error instanceof Error ? error.message : 'Failed to fetch all issues');
      }
    },
    staleTime: 30000,
  });

  return { allIssues };
};
