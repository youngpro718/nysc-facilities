// Notifications — user notification management with realtime
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useEffect, useId } from "react";
import { logger } from "@/lib/logger";

export interface Notification {
  id: string;
  type: 'issue_update' | 'new_assignment' | 'maintenance' | 'key_request_approved' | 'key_request_denied' | 'key_request_fulfilled' | 'staff_task_pending' | 'staff_task_update';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  urgency?: 'low' | 'medium' | 'high';
  action_url?: string;
  metadata?: unknown;
  related_id?: string;
}

export const useNotifications = (userId?: string) => {
  const queryClient = useQueryClient();
  // A fixed channel name would collide when this hook mounts more than once
  // at a time (e.g. a page-level consumer alongside the app-shell badge) —
  // Supabase throws if you add postgres_changes listeners to an
  // already-subscribed channel, which crashed the whole app. useId() keeps
  // each mount's channel unique.
  const instanceId = useId();

  // Set up real-time subscription
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`user-notifications-${userId}-${instanceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${userId}`
        },
        () => {
          // Refetch notifications when changes occur
          queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
          queryClient.invalidateQueries({ queryKey: ['notifications-unread-count', userId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, instanceId, queryClient]);

  const query = useQuery<Notification[]>({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      if (!userId) throw new Error('No user ID available');

      const { data: notifications, error } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      return (notifications || []).map((notification: any) => ({
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        read: notification.read,
        created_at: notification.created_at,
        urgency: notification.urgency || 'medium',
        action_url: notification.action_url,
        metadata: notification.metadata || {},
        related_id: notification.related_id
      }));
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });

  // The list above is a 20-row page for display; the unread COUNT must be
  // exact and uncapped or the badge pins at the page size (the "why does it
  // say 20?" bug — real unread was 83).
  const unreadCountQuery = useQuery<number>({
    queryKey: ['notifications-unread-count', userId],
    queryFn: async () => {
      if (!userId) return 0;
      const { count, error } = await supabase
        .from('user_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    queryClient.invalidateQueries({ queryKey: ['notifications-unread-count', userId] });
  };

  /**
   * Mark whole categories read — used by pages that display the underlying
   * records (e.g. My Requests marks supply/task updates read on visit), so
   * the unread count means "things you haven't seen" rather than
   * "notifications you haven't clicked".
   */
  const markTypesAsRead = async (types: string[]) => {
    if (!userId || types.length === 0) return;
    try {
      const { error } = await supabase
        .from('user_notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false)
        .in('type', types);
      if (error) throw error;
      invalidateAll();
    } catch (error) {
      logger.error('Failed to mark notification types as read:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('user_notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) throw error;
      invalidateAll();
    } catch (error) {
      logger.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('user_notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;
      invalidateAll();
    } catch (error) {
      logger.error('Failed to mark all notifications as read:', error);
    }
  };

  const clearNotification = async (notificationId: string) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('user_notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) throw error;
      invalidateAll();
      await queryClient.refetchQueries({ queryKey: ['notifications', userId] });
    } catch (error) {
      logger.error('Failed to clear notification:', error);
    }
  };

  const clearAllNotifications = async () => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('user_notifications')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
      invalidateAll();
      await queryClient.refetchQueries({ queryKey: ['notifications', userId] });
    } catch (error) {
      logger.error('Failed to clear all notifications:', error);
    }
  };

  return {
    ...query,
    notifications: query.data || [],
    unreadCount: unreadCountQuery.data ?? 0,
    markAsRead,
    markAllAsRead,
    markTypesAsRead,
    clearNotification,
    clearAllNotifications
  };
};
