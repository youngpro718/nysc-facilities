// Per-admin dismissal of building-card issue photos (dashboard_photo_dismissals).
// Dismissing just moves a photo out of the dashboard hero slot for the
// dismissing admin — it never touches the issue's real status or the
// separate `issues.seen` flag (that one belongs to the reporter's own view).
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export function useDismissedIssuePhotos(userId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery<Set<string>>({
    queryKey: ['dashboard-photo-dismissals', userId],
    queryFn: async () => {
      if (!userId) return new Set<string>();
      const { data, error } = await supabase
        .from('dashboard_photo_dismissals')
        .select('issue_id')
        .eq('user_id', userId);
      if (error) throw error;
      return new Set((data || []).map((row) => row.issue_id as string));
    },
    enabled: !!userId,
    staleTime: 60 * 1000,
  });

  const dismissMutation = useMutation({
    mutationFn: async (issueId: string) => {
      if (!userId) return;
      const { error } = await supabase
        .from('dashboard_photo_dismissals')
        .upsert({ user_id: userId, issue_id: issueId }, { onConflict: 'user_id,issue_id' });
      if (error) throw error;
    },
    onMutate: async (issueId: string) => {
      // Optimistic update so the hero swaps instantly on click.
      await queryClient.cancelQueries({ queryKey: ['dashboard-photo-dismissals', userId] });
      const previous = queryClient.getQueryData<Set<string>>(['dashboard-photo-dismissals', userId]);
      queryClient.setQueryData<Set<string>>(['dashboard-photo-dismissals', userId], (old) => {
        const next = new Set(old);
        next.add(issueId);
        return next;
      });
      return { previous };
    },
    onError: (error, _issueId, context) => {
      logger.error('Failed to dismiss issue photo:', error);
      if (context?.previous) {
        queryClient.setQueryData(['dashboard-photo-dismissals', userId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-photo-dismissals', userId] });
    },
  });

  return {
    dismissedIds: query.data ?? new Set<string>(),
    isLoading: query.isLoading,
    dismissPhoto: dismissMutation.mutate,
  };
}
