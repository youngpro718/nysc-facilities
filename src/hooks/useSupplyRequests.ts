import { useQuery } from '@tanstack/react-query';
import { getSupplyRequests } from '@/lib/supabase';

export function useSupplyRequests(userId?: string) {
  return useQuery({
    queryKey: ['supply-requests', userId],
    queryFn: () => getSupplyRequests(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}