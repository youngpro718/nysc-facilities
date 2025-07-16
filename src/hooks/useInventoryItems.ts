import { useQuery } from '@tanstack/react-query';
import { getInventoryItems } from '@/services/supabase/supplyRequestService';

export function useInventoryItems() {
  return useQuery({
    queryKey: ['inventory-items'],
    queryFn: getInventoryItems,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}