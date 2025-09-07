import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface KeyOrder {
  id: string;
  key_id: string | null;
  requestor_id: string | null;
  recipient_id: string | null;
  quantity: number;
  ordered_at: string | null;
  expected_delivery_date: string | null;
  received_at: string | null;
  status: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export const useKeyOrders = (userId?: string) => {
  return useQuery<KeyOrder[]>({
    queryKey: ['keyOrders', userId],
    queryFn: async () => {
      if (!userId) throw new Error('No user ID available');

      const { data, error } = await supabase
        .from('key_orders')
        .select('*')
        .eq('requestor_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
};