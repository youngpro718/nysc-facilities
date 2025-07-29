
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCallback } from "react";
import { toast } from "sonner";
import type { UserIssue } from "@/types/dashboard";

export const useIssues = (userId?: string) => {
  const queryClient = useQueryClient();

  const { data: userIssues = [], refetch: refetchIssues } = useQuery<UserIssue[]>({
    queryKey: ['userIssues', userId],
    queryFn: async () => {
      if (!userId) throw new Error('No user ID available');
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

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    staleTime: 30000, // Cache for 30 seconds
  });

  const { data: issues = [] } = useQuery<UserIssue[]>({
    queryKey: ['allIssues'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('issues')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
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

      if (error) throw error;

      queryClient.setQueryData(['userIssues', userId], (old: UserIssue[] | undefined) =>
        old?.map(issue =>
          issue.id === id ? { ...issue, seen: true } : issue
        )
      );
    } catch (error) {
      console.error('Error marking issue as seen:', error);
      toast.error('Failed to mark issue as seen');
    }
  }, [queryClient, userId]);

  return { userIssues, issues, handleMarkAsSeen, refetchIssues };
};
