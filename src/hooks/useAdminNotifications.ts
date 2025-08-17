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

      // Fetch current read_by to avoid overwriting
      const { data: existing, error: fetchError } = await supabase
        .from('admin_notifications')
        .select('read_by')
        .eq('id', notificationId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      const current = Array.isArray(existing?.read_by) ? existing!.read_by as string[] : [];
      const next = Array.from(new Set([...(current || []), user.id]));

      const { error } = await supabase
        .from('admin_notifications')
        .update({ read_by: next })
        .eq('id', notificationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminNotifications'] });
    },
  });
};