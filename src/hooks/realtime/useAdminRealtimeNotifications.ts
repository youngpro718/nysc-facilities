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
 * Uses a SINGLE multiplexed channel for all admin-related realtime updates
 * Replaces 9+ separate channels with 1 channel
 */
export const useAdminRealtimeNotifications = (): AdminRealtimeNotificationHook => {
  const { user, isAdmin } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [lastNotification, setLastNotification] = useState<Record<string, unknown> | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id || !isAdmin) return;

    logger.debug('[AdminRealtime] Setting up consolidated admin notifications for:', user.id);

    // Single multiplexed channel for all admin updates
    const channel = supabase
      .channel('admin-realtime-hub')
      // Admin notifications
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
          queryClient.invalidateQueries({ queryKey: ['adminNotifications'] });

          const toastOptions = {
            duration: notification.urgency === 'high' ? 10000 : 6000,
            action: {
              label: 'View',
              onClick: () => {
                const actionUrl = notification.metadata?.action_url;
                window.location.href = actionUrl || '/admin';
              },
            },
          };

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
          };

          const icon = icons[notification.notification_type] || '📋';
          const toastFn = notification.urgency === 'high' ? toast.error : toast.info;

          toastFn(`${icon} ${notification.title}`, {
            description: notification.message,
            ...toastOptions,
          });
        }
      )
      // Key requests
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'key_requests' },
        (payload) => {
          logger.debug('[AdminRealtime] New key request:', payload);
          const request = payload.new;
          toast.info('🔑 New Key Request', {
            description: `Request for ${request.request_type} key submitted`,
            duration: 8000,
            action: { label: 'Review Request', onClick: () => (window.location.href = '/admin/key-requests') },
          });
          queryClient.invalidateQueries({ queryKey: ['adminNotifications'] });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'key_requests' },
        (payload) => {
          logger.debug('[AdminRealtime] Key request updated:', payload);
          queryClient.invalidateQueries({ queryKey: ['adminNotifications'] });
        }
      )
      // Supply requests
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'supply_requests' },
        (payload) => {
          logger.debug('[AdminRealtime] New supply request:', payload);
          const request = payload.new;
          const isUrgent = request.priority === 'high';

          if (isUrgent) {
            toast.error('🚨 Urgent Supply Request', {
              description: `High priority request: "${request.title}"`,
              duration: 10000,
              action: { label: 'Review Now', onClick: () => (window.location.href = '/admin/supply-requests') },
            });
          } else {
            toast.info('📦 New Supply Request', {
              description: `Request: "${request.title}"`,
              duration: 6000,
              action: { label: 'Review Request', onClick: () => (window.location.href = '/admin/supply-requests') },
            });
          }
          queryClient.invalidateQueries({ queryKey: ['adminNotifications'] });
        }
      )
      // Issues
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'issues' },
        (payload) => {
          logger.debug('[AdminRealtime] New issue:', payload);
          const issue = payload.new;
          const isCritical = issue.priority === 'high';

          if (isCritical) {
            toast.error('🚨 Critical Issue Reported', {
              description: `High severity: "${issue.title}"`,
              duration: 12000,
              action: { label: 'Address Now', onClick: () => (window.location.href = '/admin/issues') },
            });
          } else {
            toast.warning('⚠️ New Issue Reported', {
              description: `Issue: "${issue.title}"`,
              duration: 8000,
              action: { label: 'Review Issue', onClick: () => (window.location.href = '/admin/issues') },
            });
          }

          queryClient.invalidateQueries({ queryKey: ['adminNotifications'] });
          queryClient.invalidateQueries({ queryKey: ['issues'] });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'issues' },
        (payload) => {
          logger.debug('[AdminRealtime] Issue updated:', payload);
          const issue = payload.new;

          if (issue.status === 'resolved') {
            toast.success('✅ Issue Resolved', {
              description: `"${issue.title}" has been resolved.`,
              duration: 6000,
              action: { label: 'View', onClick: () => (window.location.href = '/admin/issues') },
            });
          }

          queryClient.invalidateQueries({ queryKey: ['adminNotifications'] });
          queryClient.invalidateQueries({ queryKey: ['issues'] });
        }
      )
      // Key orders
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'key_orders' },
        (payload) => {
          logger.debug('[AdminRealtime] New key order:', payload);
          const order = payload.new;
          toast.info('🛒 New Key Order', {
            description: `Order #${order.id} created`,
            duration: 6000,
            action: { label: 'View', onClick: () => (window.location.href = '/admin/key-orders') },
          });
          queryClient.invalidateQueries({ queryKey: ['adminNotifications'] });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'key_orders' },
        (payload) => {
          logger.debug('[AdminRealtime] Key order updated:', payload);
          queryClient.invalidateQueries({ queryKey: ['adminNotifications'] });
        }
      )
      // Profiles
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'profiles' },
        (payload) => {
          logger.debug('[AdminRealtime] New profile:', payload);
          toast.info('🆕 New User Registration', {
            description: 'A new user has registered and requires approval',
            duration: 8000,
            action: { label: 'Review User', onClick: () => (window.location.href = '/admin') },
          });
          queryClient.invalidateQueries({ queryKey: ['adminNotifications'] });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        (payload) => {
          logger.debug('[AdminRealtime] Profile updated:', payload);
          queryClient.invalidateQueries({ queryKey: ['adminNotifications'] });
        }
      )
      .subscribe((status) => {
        logger.debug('[AdminRealtime] Channel status:', status);
        setIsConnected(status === 'SUBSCRIBED');

        // Only log errors for actual failures, not cleanup-related closures
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
