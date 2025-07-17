import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface RealtimeNotificationHook {
  isConnected: boolean;
  lastNotification: any;
}

export const useRealtimeNotifications = (): RealtimeNotificationHook => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [lastNotification, setLastNotification] = useState<any>(null);

  useEffect(() => {
    if (!user?.id) return;

    console.log('Setting up realtime notifications for user:', user.id);

    // Subscribe to user notifications
    const notificationsChannel = supabase
      .channel('user-notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('New notification received:', payload);
          const notification = payload.new;
          
          setLastNotification(notification);
          
          // Show toast notification based on urgency
          const toastOptions = {
            duration: notification.urgency === 'high' ? 8000 : 4000,
            action: notification.action_url ? {
              label: 'View',
              onClick: () => window.location.href = notification.action_url
            } : undefined
          };

          switch (notification.urgency) {
            case 'high':
              toast.error(notification.title, {
                description: notification.message,
                ...toastOptions
              });
              break;
            case 'medium':
              toast.info(notification.title, {
                description: notification.message,
                ...toastOptions
              });
              break;
            case 'low':
            default:
              toast.success(notification.title, {
                description: notification.message,
                ...toastOptions
              });
              break;
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Notification updated:', payload);
          // Could handle notification updates here if needed
        }
      )
      .subscribe((status) => {
        console.log('Notifications channel status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    // Subscribe to key request updates for real-time status changes
    const keyRequestsChannel = supabase
      .channel('key-requests-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'key_requests',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Key request updated:', payload);
          const request = payload.new;
          
          // Show toast for status changes
          let message = '';
          let toastType: 'success' | 'error' | 'info' = 'info';
          
          switch (request.status) {
            case 'approved':
              message = 'Your key request has been approved!';
              toastType = 'success';
              break;
            case 'rejected':
              message = 'Your key request has been rejected.';
              toastType = 'error';
              break;
            case 'fulfilled':
              message = 'Your key is ready for pickup!';
              toastType = 'success';
              break;
          }
          
          if (message) {
            if (toastType === 'success') {
              toast.success(message, {
                action: {
                  label: 'View Details',
                  onClick: () => window.location.href = '/my-requests'
                }
              });
            } else if (toastType === 'error') {
              toast.error(message, {
                action: {
                  label: 'View Details',
                  onClick: () => window.location.href = '/my-requests'
                }
              });
            } else {
              toast.info(message);
            }
          }
        }
      )
      .subscribe();

    // Subscribe to key order updates
    const keyOrdersChannel = supabase
      .channel('key-orders-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'key_orders',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Key order updated:', payload);
          const order = payload.new;
          
          if (order.status === 'ready_for_pickup') {
            toast.success('🔑 Your key is ready for pickup!', {
              description: 'Visit the facilities office with your ID',
              duration: 8000,
              action: {
                label: 'View Order',
                onClick: () => window.location.href = '/my-requests'
              }
            });
          }
        }
      )
      .subscribe();

    // Subscribe to supply request updates
    const supplyRequestsChannel = supabase
      .channel('supply-requests-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'supply_requests',
          filter: `requester_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Supply request updated:', payload);
          const request = payload.new;
          
          let message = '';
          let toastType: 'success' | 'error' | 'info' = 'info';
          
          switch (request.status) {
            case 'approved':
              message = `Supply request "${request.title}" has been approved!`;
              toastType = 'success';
              break;
            case 'rejected':
              message = `Supply request "${request.title}" has been rejected.`;
              toastType = 'error';
              break;
            case 'fulfilled':
              message = `Supply request "${request.title}" has been fulfilled!`;
              toastType = 'success';
              break;
            case 'under_review':
              message = `Supply request "${request.title}" is now under review.`;
              toastType = 'info';
              break;
          }
          
          if (message) {
            if (toastType === 'success') {
              toast.success(message, {
                action: {
                  label: 'View Details',
                  onClick: () => window.location.href = '/my-requests'
                }
              });
            } else if (toastType === 'error') {
              toast.error(message, {
                action: {
                  label: 'View Details',
                  onClick: () => window.location.href = '/my-requests'
                }
              });
            } else {
              toast.info(message);
            }
          }
        }
      )
      .subscribe();

    // Subscribe to issue updates (for issues reported by the user)
    const issuesChannel = supabase
      .channel('issues-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'issues',
          filter: `reported_by=eq.${user.id}`
        },
        (payload) => {
          console.log('Issue updated:', payload);
          const issue = payload.new;
          
          let message = '';
          let toastType: 'success' | 'info' = 'info';
          
          switch (issue.status) {
            case 'resolved':
              message = `Issue #${issue.issue_number} has been resolved!`;
              toastType = 'success';
              break;
            case 'in_progress':
              message = `Issue #${issue.issue_number} is now being worked on.`;
              toastType = 'info';
              break;
          }
          
          if (message) {
            if (toastType === 'success') {
              toast.success(message, {
                action: {
                  label: 'View Issue',
                  onClick: () => window.location.href = `/issues/${issue.id}`
                }
              });
            } else {
              toast.info(message, {
                action: {
                  label: 'View Issue',
                  onClick: () => window.location.href = `/issues/${issue.id}`
                }
              });
            }
          }
        }
      )
      .subscribe();

    // Subscribe to room assignment changes (for assignments involving the user)
    const roomAssignmentsChannel = supabase
      .channel('room-assignments-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'room_assignments',
          filter: `occupant_id=eq.${user.id}`
        },
        (payload) => {
          console.log('New room assignment:', payload);
          const assignment = payload.new;
          
          toast.success('🏠 New Room Assignment', {
            description: assignment.is_primary 
              ? 'You have been assigned a new primary office'
              : 'You have been assigned to a new room',
            action: {
              label: 'View Details',
              onClick: () => window.location.href = '/dashboard'
            }
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'room_assignments',
          filter: `occupant_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Room assignment updated:', payload);
          const assignment = payload.new;
          
          toast.info('📋 Room Assignment Updated', {
            description: 'Your room assignment has been modified',
            action: {
              label: 'View Details',
              onClick: () => window.location.href = '/dashboard'
            }
          });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up realtime subscriptions');
      supabase.removeChannel(notificationsChannel);
      supabase.removeChannel(keyRequestsChannel);
      supabase.removeChannel(keyOrdersChannel);
      supabase.removeChannel(supplyRequestsChannel);
      supabase.removeChannel(issuesChannel);
      supabase.removeChannel(roomAssignmentsChannel);
    };
  }, [user?.id]);

  return {
    isConnected,
    lastNotification
  };
};