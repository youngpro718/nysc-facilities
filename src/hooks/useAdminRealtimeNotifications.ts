import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from "@tanstack/react-query";
import { toast } from 'sonner';

interface AdminRealtimeNotificationHook {
  isConnected: boolean;
  lastNotification: any;
}

export const useAdminRealtimeNotifications = (): AdminRealtimeNotificationHook => {
  const { user, isAdmin } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [lastNotification, setLastNotification] = useState<any>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id || !isAdmin) return;

    console.log('Setting up admin realtime notifications for user:', user.id);

    // Track created channels to safely clean them up
    const channels: ReturnType<typeof supabase.channel>[] = [];

    // Small helper to (re)subscribe with retry in case the Realtime service is still warming up
    const subscribeWithRetry = async (channel: ReturnType<typeof supabase.channel>, name: string) => {
      let attempt = 0;
      const max = 3;
      return new Promise<void>((resolve, reject) => {
        const doSub = () => {
          attempt += 1;
          channel.subscribe((status) => {
            console.log(`${name} channel status:`, status);
            if (status === 'SUBSCRIBED') {
              setIsConnected(true);
              resolve();
              return;
            }
            if (status === 'CHANNEL_ERROR' || status === 'CLOSED' || status === 'TIMED_OUT') {
              if (attempt < max) {
                const backoff = 1000 * attempt; // 1s, 2s, 3s
                console.log(`${name} channel failed, retrying in ${backoff}ms (attempt ${attempt}/${max})`);
                setTimeout(doSub, backoff);
              } else {
                console.error(`${name} channel failed after ${max} attempts`);
                setIsConnected(false);
                reject(new Error(`Failed to connect ${name} channel after ${max} attempts`));
              }
            }
          });
        };
        doSub();
      });
    };

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
          // Keep the notifications list in sync
          queryClient.invalidateQueries({ queryKey: ['adminNotifications'] });
          
          // Show toast notification based on urgency and type
          const toastOptions = {
            duration: notification.urgency === 'high' ? 10000 : 6000,
            action: {
              label: 'View',
              onClick: () => {
                // Navigate based on notification type
                const actionUrl = (notification as any)?.metadata?.action_url as string | undefined;
                if (actionUrl) {
                  window.location.href = actionUrl;
                } else switch (notification.notification_type) {
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
                  case 'new_user_pending':
                    window.location.href = '/admin';
                    break;
                  case 'user_approved':
                  case 'user_rejected':
                  case 'role_assigned':
                  case 'role_removed':
                    window.location.href = '/admin';
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
            case 'new_user_pending':
              icon = '🆕';
              toastFn = toast.info;
              break;
            case 'user_approved':
              icon = '✅';
              toastFn = toast.success;
              break;
            case 'user_rejected':
              icon = '🚫';
              toastFn = toast.warning;
              break;
            case 'role_assigned':
              icon = '👤';
              toastFn = toast.info;
              break;
            case 'role_removed':
              icon = '➖';
              toastFn = toast.info;
              break;
          }

          toastFn(`${icon} ${notification.title}`, {
            description: notification.message,
            ...toastOptions
          });
        }
      );

    // Kick off subscription with retry
    subscribeWithRetry(adminNotificationsChannel, 'Admin notifications');
    channels.push(adminNotificationsChannel);

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
          // If a trigger also inserts into admin_notifications, keep cache fresh
          queryClient.invalidateQueries({ queryKey: ['adminNotifications'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'key_requests'
        },
        (payload) => {
          console.log('Key request updated for admin:', payload);
          const req = payload.new as any;
          const status = (req?.status || '').toString();

          let message = '';
          let fn = toast.info;
          switch (status) {
            case 'approved':
              message = 'A key request was approved';
              fn = toast.success;
              break;
            case 'rejected':
              message = 'A key request was rejected';
              fn = toast.warning;
              break;
            case 'fulfilled':
              message = 'A key request was fulfilled';
              fn = toast.success;
              break;
            default:
              message = `Key request status changed to ${status}`;
          }

          fn('🔑 Key Request Updated', {
            description: message,
            duration: 6000,
            action: {
              label: 'View',
              onClick: () => window.location.href = '/admin/key-requests'
            }
          });
          queryClient.invalidateQueries({ queryKey: ['adminNotifications'] });
        }
      )
      .subscribe();
    channels.push(keyRequestsChannel);

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
          
          const isUrgent = request.priority === 'high';
          
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
          // Keep notifications list updated if backend mirrors to admin_notifications
          queryClient.invalidateQueries({ queryKey: ['adminNotifications'] });
        }
      )
      .subscribe();
    channels.push(supplyRequestsChannel);

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
          const issue = payload.new as any;
          const priority = (issue?.priority || '').toLowerCase();
          const isCritical = ['high'].includes(priority);
          
          if (isCritical) {
            toast.error('🚨 Critical Issue Reported', {
              description: `High severity: "${issue.title}"`,
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
          // Invalidate related caches for immediate UI refresh across dashboards
          queryClient.invalidateQueries({ queryKey: ['adminNotifications'] });
          queryClient.invalidateQueries({ queryKey: ['adminIssues'] });
          queryClient.invalidateQueries({ queryKey: ['issues'] });
          queryClient.invalidateQueries({ queryKey: ['court-issues'] });
          queryClient.invalidateQueries({ queryKey: ['interactive-operations'] });
          queryClient.invalidateQueries({ queryKey: ['quick-actions'] });
          queryClient.invalidateQueries({ queryKey: ['assignment-stats'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'issues'
        },
        (payload) => {
          console.log('Issue updated for admin:', payload);
          const issue = payload.new as any;
          if (issue?.status === 'resolved') {
            toast.success('✅ Issue Resolved', {
              description: `"${issue.title}" has been resolved.`,
              duration: 6000,
              action: {
                label: 'View',
                onClick: () => window.location.href = '/admin/issues'
              }
            });
          }
          queryClient.invalidateQueries({ queryKey: ['adminNotifications'] });
          queryClient.invalidateQueries({ queryKey: ['adminIssues'] });
          queryClient.invalidateQueries({ queryKey: ['issues'] });
          queryClient.invalidateQueries({ queryKey: ['court-issues'] });
          queryClient.invalidateQueries({ queryKey: ['interactive-operations'] });
          queryClient.invalidateQueries({ queryKey: ['quick-actions'] });
          queryClient.invalidateQueries({ queryKey: ['assignment-stats'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'issues'
        },
        (payload) => {
          console.log('Issue deleted for admin:', payload);
          queryClient.invalidateQueries({ queryKey: ['adminNotifications'] });
          queryClient.invalidateQueries({ queryKey: ['adminIssues'] });
          queryClient.invalidateQueries({ queryKey: ['issues'] });
          queryClient.invalidateQueries({ queryKey: ['court-issues'] });
          queryClient.invalidateQueries({ queryKey: ['interactive-operations'] });
          queryClient.invalidateQueries({ queryKey: ['quick-actions'] });
          queryClient.invalidateQueries({ queryKey: ['assignment-stats'] });
        }
      )
      .subscribe();
    channels.push(issuesChannel);

    // Subscribe to key orders (INSERT and UPDATE)
    const keyOrdersChannel = supabase
      .channel('admin-key-orders-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'key_orders' },
        (payload) => {
          console.log('New key order for admin:', payload);
          const order = payload.new as any;
          toast.info('🛒 New Key Order', {
            description: `Order #${order?.id ?? ''} created`,
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
          console.log('Key order updated for admin:', payload);
          const order = payload.new as any;
          const status = (order?.status || '').toString();
          const fn = ['completed', 'fulfilled', 'delivered'].includes(status) ? toast.success : toast.info;
          fn('🔄 Key Order Updated', {
            description: `Order #${order?.id ?? ''} status: ${status || 'updated'}`,
            duration: 6000,
            action: { label: 'View', onClick: () => (window.location.href = '/admin/key-orders') },
          });
          queryClient.invalidateQueries({ queryKey: ['adminNotifications'] });
        }
      )
      .subscribe();
    channels.push(keyOrdersChannel);

    // Subscribe to room assignments (INSERT, UPDATE, DELETE)
    const roomAssignmentsChannel = supabase
      .channel('admin-room-assignments-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'room_assignments' },
        (payload) => {
          console.log('Room assignment created for admin:', payload);
          const assignment = payload.new as any;
          toast.info('🛏️ New Room Assignment', {
            description: `Assignment #${assignment?.id ?? ''} created`,
            duration: 6000,
            action: { label: 'View', onClick: () => (window.location.href = '/admin/room-assignments') },
          });
          queryClient.invalidateQueries({ queryKey: ['adminNotifications'] });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'room_assignments' },
        (payload) => {
          console.log('Room assignment updated for admin:', payload);
          const assignment = payload.new as any;
          toast.info('🔄 Room Assignment Updated', {
            description: `Assignment #${assignment?.id ?? ''} updated`,
            duration: 6000,
            action: { label: 'View', onClick: () => (window.location.href = '/admin/room-assignments') },
          });
          queryClient.invalidateQueries({ queryKey: ['adminNotifications'] });
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'room_assignments' },
        (payload) => {
          console.log('Room assignment deleted for admin:', payload);
          toast.warning('➖ Room Assignment Removed', {
            description: `An assignment was removed`,
            duration: 6000,
            action: { label: 'View', onClick: () => (window.location.href = '/admin/room-assignments') },
          });
          queryClient.invalidateQueries({ queryKey: ['adminNotifications'] });
        }
      )
      .subscribe();
    channels.push(roomAssignmentsChannel);

    // Subscribe to profiles (INSERT, UPDATE)
    const profilesChannel = supabase
      .channel('admin-profiles-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'profiles' },
        (payload) => {
          console.log('New profile for admin:', payload);
          const profile = payload.new as any;
          toast.info('🆕 New User Profile', {
            description: `User ${profile?.full_name ?? profile?.email ?? ''} created`,
            duration: 6000,
            action: { label: 'View', onClick: () => (window.location.href = '/admin') },
          });
          queryClient.invalidateQueries({ queryKey: ['adminNotifications'] });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        (payload) => {
          console.log('Profile updated for admin:', payload);
          const profile = payload.new as any;
          toast.info('👤 User Profile Updated', {
            description: `${profile?.full_name ?? profile?.email ?? 'A user'} was updated`,
            duration: 6000,
            action: { label: 'View', onClick: () => (window.location.href = '/admin') },
          });
          queryClient.invalidateQueries({ queryKey: ['adminNotifications'] });
        }
      )
      .subscribe();
    channels.push(profilesChannel);

    // Subscribe to court assignment changes (INSERT, UPDATE, DELETE)
    const courtAssignmentsChannel = supabase
      .channel('admin-court-assignments-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'court_assignments' },
        (payload) => {
          console.log('Court assignment created for admin:', payload);
          const assignment = payload.new as any;
          toast.info('⚖️ New Court Assignment', {
            description: `Assignment created for ${assignment?.room_number || 'courtroom'}`,
            duration: 6000,
            action: { label: 'View', onClick: () => (window.location.href = '/court-operations') },
          });
          queryClient.invalidateQueries({ queryKey: ['adminNotifications'] });
          queryClient.invalidateQueries({ queryKey: ['court-assignments-enhanced'] });
          queryClient.invalidateQueries({ queryKey: ['interactive-operations'] });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'court_assignments' },
        (payload) => {
          console.log('Court assignment updated for admin:', payload);
          const oldAssignment = payload.old as any;
          const newAssignment = payload.new as any;
          
          // Determine what changed
          let changeType = 'Assignment';
          let changeMessage = 'updated';
          let toastFn = toast.info;
          
          if (oldAssignment?.justice !== newAssignment?.justice) {
            changeType = 'Judge';
            changeMessage = `changed: ${oldAssignment?.justice || 'None'} → ${newAssignment?.justice || 'None'}`;
            toastFn = toast.warning; // Judge changes are important!
          } else if (oldAssignment?.clerks !== newAssignment?.clerks) {
            changeType = 'Clerks';
            changeMessage = 'changed';
          } else if (oldAssignment?.sergeant !== newAssignment?.sergeant) {
            changeType = 'Sergeant';
            changeMessage = `changed: ${oldAssignment?.sergeant || 'None'} → ${newAssignment?.sergeant || 'None'}`;
          } else if (oldAssignment?.part !== newAssignment?.part) {
            changeType = 'Part';
            changeMessage = `changed: ${oldAssignment?.part || 'None'} → ${newAssignment?.part || 'None'}`;
          }
          
          toastFn(`⚖️ ${changeType} ${changeMessage}`, {
            description: `Room: ${newAssignment?.room_number || 'Unknown'}`,
            duration: 8000,
            action: { label: 'View', onClick: () => (window.location.href = '/court-operations') },
          });
          
          queryClient.invalidateQueries({ queryKey: ['adminNotifications'] });
          queryClient.invalidateQueries({ queryKey: ['court-assignments-enhanced'] });
          queryClient.invalidateQueries({ queryKey: ['interactive-operations'] });
          queryClient.invalidateQueries({ queryKey: ['quick-actions'] });
          queryClient.invalidateQueries({ queryKey: ['assignment-stats'] });
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'court_assignments' },
        (payload) => {
          console.log('Court assignment deleted for admin:', payload);
          const assignment = payload.old as any;
          toast.warning('⚖️ Court Assignment Removed', {
            description: `Assignment deleted for ${assignment?.room_number || 'courtroom'}`,
            duration: 6000,
            action: { label: 'View', onClick: () => (window.location.href = '/court-operations') },
          });
          queryClient.invalidateQueries({ queryKey: ['adminNotifications'] });
          queryClient.invalidateQueries({ queryKey: ['court-assignments-enhanced'] });
          queryClient.invalidateQueries({ queryKey: ['interactive-operations'] });
        }
      )
      .subscribe();
    channels.push(courtAssignmentsChannel);

    return () => {
      console.log('Cleaning up admin realtime subscriptions');
      channels.forEach((ch) => {
        try { supabase.removeChannel(ch); } catch (_) {}
      });
    };
  }, [user?.id, isAdmin, queryClient]);

  return {
    isConnected,
    lastNotification
  };
};