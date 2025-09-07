import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface KeyRequest {
  id: string;
  key_id: string | null;
  reason: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
  user_id: string | null;
  request_type: 'spare' | 'replacement' | 'new';
  room_id: string | null;
  room_other: string | null;
  quantity: number;
  emergency_contact: string | null;
  admin_notes: string | null;
  email_notifications_enabled: boolean;
  approved_by?: string | null;
  approved_at?: string | null;
  rejected_by?: string | null;
  rejected_at?: string | null;
  rejection_reason?: string | null;
  fulfillment_notes?: string | null;
  last_status_change?: string | null;
}

export const useKeyRequests = (userId?: string) => {
  return useQuery<KeyRequest[]>({
    queryKey: ['keyRequests', userId],
    queryFn: async () => {
      if (!userId) throw new Error('No user ID available');

      const { data, error } = await supabase
        .from('key_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
};