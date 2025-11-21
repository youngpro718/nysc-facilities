import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface RealtimeNotificationHook {
  isConnected: boolean;
  lastNotification: any;
}

/**
 * Consolidated User Realtime Notifications
 * Uses a SINGLE multiplexed channel for all user-related realtime updates
 * Replaces 6 separate channels with 1 channel
 */
export const useUserRealtimeNotifications = (): RealtimeNotificationHook => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [lastNotification, setLastNotification] = useState<any>(null);

  useEffect(() => {
    if (!user?.id) return;

    console.log('[UserRealtime] Setting up consolidated user notifications for:', user.id);

    // Single multiplexed channel for all user updates
    const channel = supabase
      .channel('user-realtime-hub')
      // User notifications
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[UserRealtime] New notification:', payload);
          const notification = payload.new;
          setLastNotification(notification);

          const toastOptions = {
            duration: notification.urgency === 'high' ? 8000 : 4000,
            action: notification.action_url
              ? {
                  label: 'View',
                  onClick: () => (window.location.href = notification.action_url),
                }
              : undefined,
          };

          switch (notification.urgency) {
            case 'high':
              toast.error(notification.title, { description: notification.message, ...toastOptions });
              break;
            case 'medium':
              toast.info(notification.title, { description: notification.message, ...toastOptions });
              break;
            default:
              toast.success(notification.title, { description: notification.message, ...toastOptions });
              break;
          }
        }
      )
      // Key request updates
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'key_requests',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[UserRealtime] Key request updated:', payload);
          const request = payload.new;

          const statusMessages: Record<string, { message: string; type: 'success' | 'error' | 'info' }> = {
            approved: { message: 'Your key request has been approved!', type: 'success' },
            rejected: { message: 'Your key request has been rejected.', type: 'error' },
            fulfilled: { message: 'Your key is ready for pickup!', type: 'success' },
          };

          const statusInfo = statusMessages[request.status];
          if (statusInfo) {
            toast[statusInfo.type](statusInfo.message, {
              action: {
                label: 'View Details',
                onClick: () => (window.location.href = '/my-requests'),
              },
            });
          }
        }
      )
      // Key order updates
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'key_orders',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[UserRealtime] Key order updated:', payload);
          const order = payload.new;

          if (order.status === 'ready_for_pickup') {
            toast.success('🔑 Your key is ready for pickup!', {
              description: 'Visit the facilities office with your ID',
              duration: 8000,
              action: {
                label: 'View Order',
                onClick: () => (window.location.href = '/my-requests'),
              },
            });
          }
        }
      )
      // Supply request updates
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'supply_requests',
          filter: `requester_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[UserRealtime] Supply request updated:', payload);
          const request = payload.new;

          const statusMessages: Record<string, { message: string; type: 'success' | 'error' | 'info' }> = {
            approved: { message: `Supply request "${request.title}" has been approved!`, type: 'success' },
            rejected: { message: `Supply request "${request.title}" has been rejected.`, type: 'error' },
            fulfilled: { message: `Supply request "${request.title}" has been fulfilled!`, type: 'success' },
            under_review: { message: `Supply request "${request.title}" is now under review.`, type: 'info' },
          };

          const statusInfo = statusMessages[request.status];
          if (statusInfo) {
            toast[statusInfo.type](statusInfo.message, {
              action: {
                label: 'View Details',
                onClick: () => (window.location.href = '/my-requests'),
              },
            });
          }
        }
      )
      // Issue updates
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'issues',
          filter: `reported_by=eq.${user.id}`,
        },
        (payload) => {
          console.log('[UserRealtime] Issue updated:', payload);
          const issue = payload.new;

          const statusMessages: Record<string, { message: string; type: 'success' | 'info' }> = {
            resolved: { message: `Issue #${issue.issue_number} has been resolved!`, type: 'success' },
            in_progress: { message: `Issue #${issue.issue_number} is now being worked on.`, type: 'info' },
          };

          const statusInfo = statusMessages[issue.status];
          if (statusInfo) {
            toast[statusInfo.type](statusInfo.message, {
              action: {
                label: 'Issues',
                onClick: () => (window.location.href = `/operations?tab=issues&issue_id=${issue.id}`),
              },
            });
          }
        }
      )
      // Room assignment changes
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'room_assignments',
          filter: `occupant_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[UserRealtime] New room assignment:', payload);
          const assignment = payload.new;

          toast.success('🏠 New Room Assignment', {
            description: assignment.is_primary
              ? 'You have been assigned a new primary office'
              : 'You have been assigned to a new room',
            action: {
              label: 'View Details',
              onClick: () => (window.location.href = '/dashboard'),
            },
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'room_assignments',
          filter: `occupant_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[UserRealtime] Room assignment updated:', payload);
          toast.info('📋 Room Assignment Updated', {
            description: 'Your room assignment has been modified',
            action: {
              label: 'View Details',
              onClick: () => (window.location.href = '/dashboard'),
            },
          });
        }
      )
      .subscribe((status) => {
        console.log('[UserRealtime] Channel status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      console.log('[UserRealtime] Cleaning up');
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return {
    isConnected,
    lastNotification,
  };
};
