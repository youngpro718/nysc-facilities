import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface KeyRequest {
  id: string;
  key_id: string | null;
  reason: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
  user_id: string | null;
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