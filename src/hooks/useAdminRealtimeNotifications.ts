import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AdminRealtimeNotificationHook {
  isConnected: boolean;
  lastNotification: any;
}

export const useAdminRealtimeNotifications = (): AdminRealtimeNotificationHook => {
  const { user, isAdmin } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [lastNotification, setLastNotification] = useState<any>(null);

  useEffect(() => {
    if (!user?.id || !isAdmin) return;

    console.log('Setting up admin realtime notifications for user:', user.id);

    // Subscribe to admin notifications
    const adminNotificationsChannel = supabase
      .channel('admin-notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_notifications'
        },
        (payload) => {
          console.log('New admin notification received:', payload);
          const notification = payload.new;
          
          setLastNotification(notification);
          
          // Show toast notification based on urgency and type
          const toastOptions = {
            duration: notification.urgency === 'high' ? 10000 : 6000,
            action: {
              label: 'View',
              onClick: () => {
                // Navigate based on notification type
                switch (notification.notification_type) {
                  case 'new_key_request':
                    window.location.href = '/admin/key-requests';
                    break;
                  case 'new_supply_request':
                    window.location.href = '/admin/supply-requests';
                    break;
                  case 'new_issue':
                    window.location.href = '/admin/issues';
                    break;
                  case 'new_key_order':
                    window.location.href = '/admin/key-orders';
                    break;
                  default:
                    window.location.href = '/admin';
                }
              }
            }
          };

          // Determine toast type and icon based on notification type
          let toastFn = toast.info;
          let icon = '📋';
          
          switch (notification.notification_type) {
            case 'new_key_request':
              icon = '🔑';
              toastFn = notification.urgency === 'high' ? toast.error : toast.info;
              break;
            case 'new_supply_request':
              icon = '📦';
              toastFn = notification.urgency === 'high' ? toast.error : toast.info;
              break;
            case 'new_issue':
              icon = '⚠️';
              toastFn = notification.urgency === 'high' ? toast.error : toast.warning;
              break;
            case 'new_key_order':
              icon = '🛒';
              toastFn = toast.info;
              break;
            case 'issue_status_change':
              icon = '🔄';
              toastFn = toast.info;
              break;
          }

          toastFn(`${icon} ${notification.title}`, {
            description: notification.message,
            ...toastOptions
          });
        }
      )
      .subscribe((status) => {
        console.log('Admin notifications channel status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    // Subscribe to new key requests for immediate admin notification
    const keyRequestsChannel = supabase
      .channel('admin-key-requests-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'key_requests'
        },
        (payload) => {
          console.log('New key request for admin:', payload);
          const request = payload.new;
          
          toast.info('🔑 New Key Request', {
            description: `Request for ${request.request_type} key submitted`,
            duration: 8000,
            action: {
              label: 'Review Request',
              onClick: () => window.location.href = '/admin/key-requests'
            }
          });
        }
      )
      .subscribe();

    // Subscribe to new supply requests for immediate admin notification
    const supplyRequestsChannel = supabase
      .channel('admin-supply-requests-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'supply_requests'
        },
        (payload) => {
          console.log('New supply request for admin:', payload);
          const request = payload.new;
          
          const isUrgent = request.priority === 'urgent' || request.priority === 'high';
          
          if (isUrgent) {
            toast.error('🚨 Urgent Supply Request', {
              description: `High priority request: "${request.title}"`,
              duration: 10000,
              action: {
                label: 'Review Now',
                onClick: () => window.location.href = '/admin/supply-requests'
              }
            });
          } else {
            toast.info('📦 New Supply Request', {
              description: `Request: "${request.title}"`,
              duration: 6000,
              action: {
                label: 'Review Request',
                onClick: () => window.location.href = '/admin/supply-requests'
              }
            });
          }
        }
      )
      .subscribe();

    // Subscribe to new issues for immediate admin notification
    const issuesChannel = supabase
      .channel('admin-issues-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'issues'
        },
        (payload) => {
          console.log('New issue for admin:', payload);
          const issue = payload.new;
          
          const isCritical = issue.priority === 'critical';
          
          if (isCritical) {
            toast.error('🚨 Critical Issue Reported', {
              description: `Critical: "${issue.title}"`,
              duration: 12000,
              action: {
                label: 'Address Now',
                onClick: () => window.location.href = '/admin/issues'
              }
            });
          } else {
            toast.warning('⚠️ New Issue Reported', {
              description: `Issue: "${issue.title}"`,
              duration: 8000,
              action: {
                label: 'Review Issue',
                onClick: () => window.location.href = '/admin/issues'
              }
            });
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up admin realtime subscriptions');
      supabase.removeChannel(adminNotificationsChannel);
      supabase.removeChannel(keyRequestsChannel);
      supabase.removeChannel(supplyRequestsChannel);
      supabase.removeChannel(issuesChannel);
    };
  }, [user?.id, isAdmin]);

  return {
    isConnected,
    lastNotification
  };
};