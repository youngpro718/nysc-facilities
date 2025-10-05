
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useEffect } from "react";

export interface Notification {
  id: string;
  type: 'issue_update' | 'new_assignment' | 'maintenance' | 'key_request_approved' | 'key_request_denied' | 'key_request_fulfilled';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  urgency?: 'low' | 'medium' | 'high';
  action_url?: string;
  metadata?: any;
  related_id?: string;
}

export const useNotifications = (userId?: string) => {
  const queryClient = useQueryClient();

  // Set up real-time subscription
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('user-notifications')
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
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

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

  const markAsRead = async (notificationId: string) => {
    if (!userId) {
      console.error('markAsRead: No user ID available');
      return;
    }

    console.log('Marking notification as read:', { notificationId, userId });

    try {
      const { error } = await supabase
        .from('user_notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error marking notification as read:', error);
        throw error;
      }

      console.log('Notification marked as read successfully');
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!userId) {
      console.error('markAllAsRead: No user ID available');
      return;
    }

    console.log('Marking all notifications as read for user:', userId);

    try {
      const { error } = await supabase
        .from('user_notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        throw error;
      }

      console.log('All notifications marked as read successfully');
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const clearNotification = async (notificationId: string) => {
    if (!userId) {
      console.error('clearNotification: No user ID available');
      return;
    }

    console.log('Clearing notification:', { notificationId, userId });

    try {
      const { error } = await supabase
        .from('user_notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error clearing notification:', error);
        throw error;
      }

      console.log('Notification cleared successfully');
      // Invalidate and refetch immediately
      await queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
      await queryClient.refetchQueries({ queryKey: ['notifications', userId] });
    } catch (error) {
      console.error('Failed to clear notification:', error);
    }
  };

  const clearAllNotifications = async () => {
    if (!userId) {
      console.error('clearAllNotifications: No user ID available');
      return;
    }

    console.log('Clearing all notifications for user:', userId);

    try {
      const { error } = await supabase
        .from('user_notifications')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Error clearing all notifications:', error);
        throw error;
      }

      console.log('All notifications cleared successfully');
      // Invalidate and refetch immediately
      console.log('Invalidating queries for userId:', userId);
      await queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
      console.log('Refetching queries for userId:', userId);
      await queryClient.refetchQueries({ queryKey: ['notifications', userId] });
      console.log('Query refetch completed');
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
    }
  };

  return {
    ...query,
    notifications: query.data || [],
    unreadCount: query.data?.filter(n => !n.read).length || 0,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications
  };
};
