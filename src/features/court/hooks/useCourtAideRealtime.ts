import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/**
 * Subscribes to live changes for tables that feed the Court Aide Work Center
 * (supply requests, supply items, staff tasks, inventory) and invalidates the
 * relevant React Query caches so panels stay in sync without manual refresh.
 */
export function useCourtAideRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const invalidateSupply = () => {
      queryClient.invalidateQueries({ queryKey: ['supply-fulfillment-queue'] });
      queryClient.invalidateQueries({ queryKey: ['court-aide-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['court-aide-work-stats'] });
      queryClient.invalidateQueries({ queryKey: ['supply-pending-counts'] });
      queryClient.invalidateQueries({ queryKey: ['supply-requests'] });
    };
    const invalidateTasks = () => {
      queryClient.invalidateQueries({ queryKey: ['staff-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['staff-tasks-pending-counts'] });
      queryClient.invalidateQueries({ queryKey: ['court-aide-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['court-aide-work-stats'] });
    };
    const invalidateInventory = () => {
      queryClient.invalidateQueries({ queryKey: ['court-aide-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock-items'] });
    };

    const channel = supabase
      .channel('court-aide-work-center')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'supply_requests' }, invalidateSupply)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'supply_request_items' }, invalidateSupply)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staff_tasks' }, invalidateTasks)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_items' }, invalidateInventory)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
