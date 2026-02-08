import { useQuery } from '@tanstack/react-query';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';

interface SupplyPendingCounts {
  pendingApprovals: number; // For admins: requests needing approval
  pendingOrders: number;    // For supply staff: orders to fulfill
  readyForPickup: number;   // Orders ready for pickup
}

/**
 * Hook to fetch counts for pending supply requests/orders.
 * Used for navigation badges to improve discoverability.
 */
export function useSupplyPendingCounts() {
  return useQuery({
    queryKey: ['supply-pending-counts'],
    queryFn: async (): Promise<SupplyPendingCounts> => {
      // Count requests needing approval (pending_approval OR has [APPROVAL REQUIRED] but not yet approved)
      const { count: pendingApprovalsCount, error: approvalsError } = await supabase
        .from('supply_requests')
        .select('*', { count: 'exact', head: true })
        .or('status.eq.pending_approval,justification.ilike.%[APPROVAL REQUIRED]%')
        .not('status', 'in', '(approved,rejected,completed,cancelled)');

      if (approvalsError) {
        logger.error('Error fetching pending approvals count:', approvalsError);
      }

      // Count orders pending fulfillment (submitted, approved, received, picking)
      const { count: pendingOrdersCount, error: ordersError } = await supabase
        .from('supply_requests')
        .select('*', { count: 'exact', head: true })
        .in('status', ['submitted', 'approved', 'received', 'picking']);

      if (ordersError) {
        logger.error('Error fetching pending orders count:', ordersError);
      }

      // Count orders ready for pickup
      const { count: readyCount, error: readyError } = await supabase
        .from('supply_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ready');

      if (readyError) {
        logger.error('Error fetching ready count:', readyError);
      }

      return {
        pendingApprovals: pendingApprovalsCount || 0,
        pendingOrders: pendingOrdersCount || 0,
        readyForPickup: readyCount || 0,
      };
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refresh every minute
  });
}
