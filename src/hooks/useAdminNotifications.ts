import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AdminNotification {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  urgency: string;
  related_table: string | null;
  related_id: string | null;
  metadata: any;
  read_by: string[] | null;
  created_at: string;
  expires_at: string | null;
}

export const useAdminNotifications = () => {
  return useQuery<AdminNotification[]>({
    queryKey: ['adminNotifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Update the read_by array directly
      const { error } = await supabase
        .from('admin_notifications')
        .update({
          read_by: [user.id] // Simple approach for now
        })
        .eq('id', notificationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminNotifications'] });
    },
  });
};