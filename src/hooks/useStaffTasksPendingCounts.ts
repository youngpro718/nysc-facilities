import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface StaffTasksPendingCounts {
  pendingApproval: number;   // For admins: tasks needing approval
  availableToClaim: number;  // For workers: approved tasks available to claim
}

/**
 * Hook to fetch counts for pending staff tasks.
 * Used for navigation badges to show accurate task counts.
 */
export function useStaffTasksPendingCounts() {
  return useQuery({
    queryKey: ['staff-tasks-pending-counts'],
    queryFn: async (): Promise<StaffTasksPendingCounts> => {
      // Count tasks needing approval (for admins)
      const { count: pendingApprovalCount, error: approvalError } = await supabase
        .from('staff_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending_approval');

      if (approvalError) {
        console.error('Error fetching pending approval count:', approvalError);
      }

      // Count approved tasks available to claim (for workers)
      const { count: availableToClaimCount, error: claimError } = await supabase
        .from('staff_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved')
        .is('claimed_by', null);

      if (claimError) {
        console.error('Error fetching available to claim count:', claimError);
      }

      return {
        pendingApproval: pendingApprovalCount || 0,
        availableToClaim: availableToClaimCount || 0,
      };
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refresh every minute
  });
}
