import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface AdminRealtimeNotificationHook {
  isConnected: boolean;
  lastNotification: unknown;
}

/**
 * Consolidated Admin Realtime Notifications
 * Listens ONLY to admin_notifications table — DB triggers handle all event→notification mapping.
 * Direct table listeners were removed to prevent duplicate toasts.
 */
export const useAdminRealtimeNotifications = (): AdminRealtimeNotificationHook => {
  const { user, isAdmin } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [lastNotification, setLastNotification] = useState<Record<string, unknown> | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id || !isAdmin) return;

    logger.debug('[AdminRealtime] Setting up admin notifications listener for:', user.id);

    const channel = supabase
      .channel('admin-realtime-hub')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_notifications',
        },
        (payload) => {
          logger.debug('[AdminRealtime] New admin notification:', payload);
          const notification = payload.new;
          setLastNotification(notification);

          // Invalidate relevant queries based on notification type
          queryClient.invalidateQueries({ queryKey: ['adminNotifications'] });

          const typeQueryMap: Record<string, string[]> = {
            new_supply_request: ['adminNotifications'],
            new_key_request: ['adminNotifications'],
            new_issue: ['adminNotifications', 'issues'],
            new_key_order: ['adminNotifications'],
            new_user_pending: ['adminNotifications'],
            user_approved: ['adminNotifications'],
            user_rejected: ['adminNotifications'],
            role_assigned: ['adminNotifications'],
            role_removed: ['adminNotifications'],
            low_stock: ['inventory-items', 'low-stock-items', 'out-of-stock-items', 'low-stock-overview', 'inventory-overview-items', 'court-aide-alerts'],
          };

          const extraKeys = typeQueryMap[notification.notification_type];
          if (extraKeys) {
            extraKeys.forEach(key => queryClient.invalidateQueries({ queryKey: [key] }));
          }

          // Toast
          const icons: Record<string, string> = {
            new_key_request: '🔑',
            new_supply_request: '📦',
            new_issue: '⚠️',
            new_key_order: '🛒',
            new_user_pending: '🆕',
            user_approved: '✅',
            user_rejected: '🚫',
            role_assigned: '👤',
            role_removed: '➖',
            low_stock: '📉',
          };

          const icon = icons[notification.notification_type] || '📋';
          const toastFn = notification.urgency === 'high' ? toast.error : toast.info;

          toastFn(`${icon} ${notification.title}`, {
            description: notification.message,
            duration: notification.urgency === 'high' ? 10000 : 6000,
            action: {
              label: 'View',
              onClick: () => {
                const actionUrl = notification.metadata?.action_url;
                window.location.href = actionUrl || '/admin';
              },
            },
          });
        }
      )
      .subscribe((status) => {
        logger.debug('[AdminRealtime] Channel status:', status);
        setIsConnected(status === 'SUBSCRIBED');

        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          logger.error('[AdminRealtime] Connection failed:', status);
        }
      });

    return () => {
      logger.debug('[AdminRealtime] Cleaning up');
      supabase.removeChannel(channel);
    };
  }, [user?.id, isAdmin, queryClient]);

  return {
    isConnected,
    lastNotification,
  };
};
