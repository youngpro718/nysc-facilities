/**
 * useCommandCenter Hook
 * 
 * Provides real-time system metrics and alerts for the admin command center
 */

import { useQuery } from '@tanstack/react-query';
import { 
  getSystemMetrics, 
  getRecentActivity, 
  getSystemAlerts,
  type SystemMetrics,
  type RecentActivity,
  type SystemAlert
} from '@features/dashboard/services/commandCenterService';

export function useCommandCenter() {
  const metricsQuery = useQuery<SystemMetrics>({
    queryKey: ['command-center-metrics'],
    queryFn: getSystemMetrics,
    staleTime: 30_000, // 30 seconds
    refetchInterval: 60_000, // Refresh every minute
  });

  const activityQuery = useQuery<RecentActivity[]>({
    queryKey: ['command-center-activity'],
    queryFn: () => getRecentActivity(20),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const alertsQuery = useQuery<SystemAlert[]>({
    queryKey: ['command-center-alerts'],
    queryFn: getSystemAlerts,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  return {
    metrics: metricsQuery.data,
    metricsLoading: metricsQuery.isLoading,
    metricsError: metricsQuery.error,
    
    activity: activityQuery.data || [],
    activityLoading: activityQuery.isLoading,
    
    alerts: alertsQuery.data || [],
    alertsLoading: alertsQuery.isLoading,
    
    isLoading: metricsQuery.isLoading || activityQuery.isLoading || alertsQuery.isLoading,
    
    refetch: () => {
      metricsQuery.refetch();
      activityQuery.refetch();
      alertsQuery.refetch();
    },
  };
}
