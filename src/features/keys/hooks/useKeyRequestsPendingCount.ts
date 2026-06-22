import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@features/auth/hooks/useAuth';

/**
 * Pending key-request count for the current user. RLS scopes this to what
 * the user is actually allowed to see — so for a Facility Coordinator
 * (facilities_manager / admin) it's the global pending queue, and for
 * anyone else it's their own pending requests (effectively unused, since
 * the Keys nav item only renders the badge for staff anyway).
 */
export function useKeyRequestsPendingCount() {
  const { user } = useAuth();
  return useQuery<number>({
    queryKey: ['key-requests-pending-count'],
    enabled: !!user?.id,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('key_requests')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');
      if (error) return 0;
      return count ?? 0;
    },
  });
}
