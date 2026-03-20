/**
 * useCMCMetrics Hook
 * 
 * Provides CMC dashboard metrics with optimized queries
 */

import { useQuery } from '@tanstack/react-query';
import { getCMCMetrics, type CMCMetrics } from '@features/court/services/cmcDashboardService';

export function useCMCMetrics(termsLimit: number = 10) {
  return useQuery<CMCMetrics>({
    queryKey: ['cmc-metrics', termsLimit],
    queryFn: () => getCMCMetrics(termsLimit),
    staleTime: 60_000, // 1 minute
    refetchInterval: 5 * 60_000, // Refresh every 5 minutes
  });
}
