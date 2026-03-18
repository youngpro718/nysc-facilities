import { useQuery } from '@tanstack/react-query';
import { getSupplyRequests } from '@features/supply/services/supplyService';

export function useSupplyRequests(userId?: string) {
  return useQuery({
    queryKey: ['supply-requests', userId],
    queryFn: () => getSupplyRequests(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}