/**
 * useStockAlert Hook
 * 
 * Quick alert system for supply staff to flag stock issues during picking
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { triggerAdminNotification } from '@/services/adminNotifications';

export type StockAlertType = 'out_of_stock' | 'low_stock';

interface StockAlertParams {
  itemId: string;
  itemName: string;
  requestId: string;
  alertType: StockAlertType;
  currentStock?: number;
}

export function useStockAlert() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const alertMutation = useMutation({
    mutationFn: async ({ itemId, itemName, requestId, alertType, currentStock }: StockAlertParams) => {
      // 1. Record in status history for audit trail
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const notes = alertType === 'out_of_stock'
        ? `Item "${itemName}" marked as OUT OF STOCK during picking`
        : `Item "${itemName}" flagged as LOW STOCK (${currentStock ?? 'unknown'} remaining)`;

      await supabase
        .from('supply_request_status_history')
        .insert({
          request_id: requestId,
          status: 'picking', // Still in picking status
          notes,
          changed_by: user.id,
          changed_at: new Date().toISOString(),
        });

      // 2. Create admin notification
      const severity = alertType === 'out_of_stock' ? 'critical' : 'warning';
      await triggerAdminNotification({
        title: alertType === 'out_of_stock' ? '🚫 Out of Stock Alert' : '⚠️ Low Stock Alert',
        message: `${itemName} ${alertType === 'out_of_stock' ? 'is out of stock' : 'is running low'} (Order #${requestId.slice(0, 8)})`,
        severity,
      });

      return { alertType, itemName };
    },
    onSuccess: ({ alertType, itemName }) => {
      toast({
        title: alertType === 'out_of_stock' ? 'Out of Stock Reported' : 'Low Stock Reported',
        description: `Admin has been notified about ${itemName}`,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Alert Failed',
        description: error.message || 'Could not send stock alert',
        variant: 'destructive',
      });
    },
  });

  const reportOutOfStock = (params: Omit<StockAlertParams, 'alertType'>) => {
    return alertMutation.mutateAsync({ ...params, alertType: 'out_of_stock' });
  };

  const reportLowStock = (params: Omit<StockAlertParams, 'alertType'>) => {
    return alertMutation.mutateAsync({ ...params, alertType: 'low_stock' });
  };

  return {
    reportOutOfStock,
    reportLowStock,
    isAlertPending: alertMutation.isPending,
  };
}
