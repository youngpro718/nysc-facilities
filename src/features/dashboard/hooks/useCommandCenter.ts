/**
 * useCommandCenter Hook
 *
 * Provides system metrics, recent activity, and alerts for the admin command
 * center.
 *
 * Previously this fired three parallel queries (metrics / activity / alerts),
 * each on its own 60-second refetchInterval. That meant three independent
 * interval timers ticking out of phase, three React Query cache keys, and
 * three separate background-refetch bursts every minute. Collapsed into one
 * query that fans out via Promise.all — one timer, one cache key, one burst.
 */

import { useQuery } from '@tanstack/react-query';
import {
  getSystemMetrics,
  getRecentActivity,
  getSystemAlerts,
  type SystemMetrics,
  type RecentActivity,
  type SystemAlert,
} from '@features/dashboard/services/commandCenterService';

interface CommandCenterData {
  metrics: SystemMetrics;
  activity: RecentActivity[];
  alerts: SystemAlert[];
}

export function useCommandCenter() {
  const query = useQuery<CommandCenterData>({
    queryKey: ['command-center'],
    queryFn: async () => {
      const [metrics, activity, alerts] = await Promise.all([
        getSystemMetrics(),
        getRecentActivity(20),
        getSystemAlerts(),
      ]);
      return { metrics, activity, alerts };
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  return {
    metrics: query.data?.metrics,
    activity: query.data?.activity || [],
    alerts: query.data?.alerts || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
