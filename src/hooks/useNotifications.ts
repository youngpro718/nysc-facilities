
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
  });

  const markAsRead = async (notificationId: string) => {
    if (!userId) return;

    const { error } = await supabase
      .from('user_notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    }
  };

  const markAllAsRead = async () => {
    if (!userId) return;

    const { error } = await supabase
      .from('user_notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    }
  };

  return {
    ...query,
    notifications: query.data || [],
    unreadCount: query.data?.filter(n => !n.read).length || 0,
    markAsRead,
    markAllAsRead
  };
};
