// @ts-nocheck
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { logger } from '@/lib/logger';
import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface UserIssue {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  priority: string;
  building_id: string;
  seen: boolean;
  photos: string[];
  buildings: { name: string };
  floors: { name: string };
  unified_spaces: { id: string; name: string; room_number: string };
}

class IssueError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IssueError';
  }
}

export function useUserIssues(userId: string | undefined) {
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
            unified_spaces (
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
        
        return (data as Record<string, unknown>)?.map((issue: Record<string, unknown>) => ({
          ...issue,
          buildings: issue.buildings?.[0] || { name: 'Unknown Building' },
          floors: issue.floors?.[0] || { name: 'Unknown Floor' },
          unified_spaces: issue.unified_spaces?.[0] || { id: '', name: 'Unknown Space', room_number: '' },
          created_at: new Date(issue.created_at).toISOString(),
        })) || [];
      } catch (error) {
        logger.error('Error fetching user issues:', error);
        throw error;
      }
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const handleMarkAsSeen = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('issues')
        .update({ seen: true })
        .eq('id', id);

      if (error) throw error;

      queryClient.setQueryData(['userIssues', userId], (old: UserIssue[] | undefined) =>
        old?.map(issue =>
          issue.id === id ? { ...issue, seen: true } : issue
        )
      );
    } catch (error) {
      logger.error('Error marking issue as seen:', error);
    }
  }, [queryClient, userId]);

  return {
    userIssues,
    refetchIssues,
    handleMarkAsSeen,
    isLoading: false, // You can add proper loading state here if needed
  };
}