import { useQuery } from '@tanstack/react-query';
import { getInventoryItems } from '@/lib/supabase';

export function useInventoryItems() {
  return useQuery({
    queryKey: ['inventory-items'],
    queryFn: getInventoryItems,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
  });
}