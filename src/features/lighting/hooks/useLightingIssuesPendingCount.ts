import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@features/auth/hooks/useAuth';

/**
 * Open lighting-issue count visible to the current user. RLS scopes naturally:
 * Facility Coordinator (facilities_manager / admin) sees the global queue;
 * everyone else sees only their own reports (effectively for badge purposes,
 * unused since the badge only renders for staff).
 */
export function useLightingIssuesPendingCount() {
  const { user } = useAuth();
  return useQuery<number>({
    queryKey: ['lighting-issues-open-count'],
    enabled: !!user?.id,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('lighting_issues')
        .select('id', { count: 'exact', head: true })
        .in('status', ['open', 'in_progress']);
      if (error) return 0;
      return count ?? 0;
    },
  });
}
