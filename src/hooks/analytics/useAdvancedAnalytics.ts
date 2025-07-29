/**
 * Advanced Analytics React Query Hooks
 * Provides sophisticated analytics with intelligent caching
 * Built on top of Phase 3 optimizations
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import {
  AdvancedAnalyticsService,
  type FacilityUtilizationData,
  type OccupancyTrendData,
  type IssueAnalyticsData,
  type MaintenanceAnalyticsData,
  type EnergyEfficiencyData,
  type SpaceOptimizationRecommendation,
} from '@/services/analytics/advancedAnalyticsService';

// Query keys for analytics
export const ANALYTICS_QUERY_KEYS = {
  analytics: {
    all: ['advanced-analytics'] as const,
    utilization: (dateRange: any, buildingId?: string) => 
      ['advanced-analytics', 'utilization', dateRange, buildingId] as const,
    occupancyTrends: (period: string) => 
      ['advanced-analytics', 'occupancy-trends', period] as const,
    issues: () => ['advanced-analytics', 'issues'] as const,
    maintenance: () => ['advanced-analytics', 'maintenance'] as const,
    energy: () => ['advanced-analytics', 'energy'] as const,
    optimization: () => ['advanced-analytics', 'optimization'] as const,
    report: (buildingId?: string) => 
      ['advanced-analytics', 'report', buildingId] as const,
  },
} as const;

// Cache configuration for analytics
const ANALYTICS_CACHE_CONFIG = {
  // Analytics data can be cached longer since it's less frequently changing
  standard: { staleTime: 10 * 60 * 1000, cacheTime: 30 * 60 * 1000 }, // 10min stale, 30min cache
  report: { staleTime: 15 * 60 * 1000, cacheTime: 60 * 60 * 1000 }, // 15min stale, 1hr cache
} as const;

/**
 * Hook for facility utilization analytics
 * Tracks space usage patterns over time
 */
export function useFacilityUtilization(
  dateRange: { start: string; end: string },
  buildingId?: string
) {
  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.analytics.utilization(dateRange, buildingId),
    queryFn: () => AdvancedAnalyticsService.getFacilityUtilization(dateRange, buildingId),
    ...ANALYTICS_CACHE_CONFIG.standard,
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

/**
 * Hook for occupancy trend analysis
 * Identifies patterns in space usage by room type
 */
export function useOccupancyTrends(period: 'daily' | 'weekly' | 'monthly' = 'weekly') {
  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.analytics.occupancyTrends(period),
    queryFn: () => AdvancedAnalyticsService.getOccupancyTrends(period),
    ...ANALYTICS_CACHE_CONFIG.standard,
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

/**
 * Hook for issue analytics and resolution metrics
 * Provides insights into problem areas and resolution efficiency
 */
export function useIssueAnalytics() {
  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.analytics.issues(),
    queryFn: () => AdvancedAnalyticsService.getIssueAnalytics(),
    ...ANALYTICS_CACHE_CONFIG.standard,
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

/**
 * Hook for predictive maintenance analytics
 * Identifies spaces that need attention based on various factors
 */
export function useMaintenanceAnalytics() {
  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.analytics.maintenance(),
    queryFn: () => AdvancedAnalyticsService.getMaintenanceAnalytics(),
    ...ANALYTICS_CACHE_CONFIG.standard,
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

/**
 * Hook for energy efficiency analytics
 * Tracks lighting and energy usage patterns
 */
export function useEnergyEfficiency() {
  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.analytics.energy(),
    queryFn: () => AdvancedAnalyticsService.getEnergyEfficiency(),
    ...ANALYTICS_CACHE_CONFIG.standard,
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

/**
 * Hook for space optimization recommendations
 * AI-powered suggestions for better space utilization
 */
export function useSpaceOptimization() {
  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.analytics.optimization(),
    queryFn: () => AdvancedAnalyticsService.getSpaceOptimizationRecommendations(),
    ...ANALYTICS_CACHE_CONFIG.standard,
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

/**
 * Hook for comprehensive facility report
 * Combines all analytics into a single comprehensive report
 */
export function useFacilityReport(buildingId?: string) {
  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.analytics.report(buildingId),
    queryFn: () => AdvancedAnalyticsService.generateFacilityReport(buildingId),
    ...ANALYTICS_CACHE_CONFIG.report,
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

/**
 * Hook for analytics dashboard summary
 * Provides key metrics and insights for dashboard display
 */
export function useAnalyticsDashboard(buildingId?: string) {
  const { data: utilization, isLoading: utilizationLoading } = useFacilityUtilization(
    { start: '2024-01-01', end: '2024-12-31' },
    buildingId
  );
  const { data: trends, isLoading: trendsLoading } = useOccupancyTrends('weekly');
  const { data: issues, isLoading: issuesLoading } = useIssueAnalytics();
  const { data: maintenance, isLoading: maintenanceLoading } = useMaintenanceAnalytics();
  const { data: energy, isLoading: energyLoading } = useEnergyEfficiency();

  const isLoading = utilizationLoading || trendsLoading || issuesLoading || maintenanceLoading || energyLoading;

  const summary = useMemo(() => {
    if (!utilization || !trends || !issues || !maintenance || !energy) {
      return null;
    }

    // Calculate key metrics with null checks
    const totalSpaces = utilization?.reduce((sum, u) => sum + (u.total_spaces || 0), 0) || 0;
    const averageUtilization = utilization?.length > 0 
      ? utilization.reduce((sum, u) => sum + (u.utilization_rate || 0), 0) / utilization.length 
      : 0;
    
    const totalIssues = issues?.reduce((sum, i) => sum + (i.total_count || 0), 0) || 0;
    const resolvedIssues = issues?.reduce((sum, i) => sum + (i.resolved_count || 0), 0) || 0;
    const resolutionRate = totalIssues > 0 ? (resolvedIssues / totalIssues) * 100 : 0;

    const criticalMaintenanceCount = maintenance?.filter(m => (m.maintenance_score || 0) < 50).length || 0;
    const averageMaintenanceScore = maintenance?.length > 0
      ? maintenance.reduce((sum, m) => sum + (m.maintenance_score || 0), 0) / maintenance.length
      : 85; // Default maintenance score

    const averageEnergyEfficiency = energy?.length > 0
      ? energy.reduce((sum, e) => sum + (e.efficiency_score || 0), 0) / energy.length
      : 75; // Default energy efficiency

    const totalPotentialSavings = energy?.reduce((sum, e) => sum + (e.potential_savings || 0), 0) || 0;

    return {
      facility_overview: {
        total_spaces: totalSpaces || 0,
        average_utilization: isNaN(averageUtilization) ? 0 : Math.round(averageUtilization * 100) / 100,
        utilization_status: averageUtilization > 80 ? 'high' : averageUtilization > 60 ? 'medium' : 'low',
      },
      issues_summary: {
        total_issues: totalIssues || 0,
        resolved_issues: resolvedIssues || 0,
        resolution_rate: isNaN(resolutionRate) ? 0 : Math.round(resolutionRate * 100) / 100,
        resolution_status: resolutionRate > 80 ? 'excellent' : resolutionRate > 60 ? 'good' : 'needs_improvement',
      },
      maintenance_summary: {
        critical_count: criticalMaintenanceCount || 0,
        average_score: isNaN(averageMaintenanceScore) ? 85 : Math.round(averageMaintenanceScore * 100) / 100,
        maintenance_status: averageMaintenanceScore > 80 ? 'excellent' : averageMaintenanceScore > 60 ? 'good' : 'attention_needed',
      },
      energy_summary: {
        average_efficiency: isNaN(averageEnergyEfficiency) ? 75 : Math.round(averageEnergyEfficiency * 100) / 100,
        potential_savings: isNaN(totalPotentialSavings) ? 0 : totalPotentialSavings,
        efficiency_status: averageEnergyEfficiency > 80 ? 'excellent' : averageEnergyEfficiency > 60 ? 'good' : 'improvement_needed',
      },
    };
  }, [utilization, trends, issues, maintenance, energy]);

  return {
    data: {
      utilization,
      trends,
      issues,
      maintenance,
      energy,
    },
    summary,
    isLoading,
  };
}

/**
 * Hook for analytics cache management
 * Provides utilities to refresh and manage analytics cache
 */
export function useAnalyticsCacheManager() {
  const queryClient = useQueryClient();

  const refreshAllAnalytics = useCallback(async () => {
    try {
      // Invalidate all analytics queries
      await queryClient.invalidateQueries({
        queryKey: ANALYTICS_QUERY_KEYS.analytics.all,
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error refreshing analytics cache:', error);
      return { success: false, error };
    }
  }, [queryClient]);

  const refreshSpecificAnalytic = useCallback(async (type: string) => {
    try {
      const queryKey = {
        utilization: ANALYTICS_QUERY_KEYS.analytics.utilization,
        trends: ANALYTICS_QUERY_KEYS.analytics.occupancyTrends,
        issues: ANALYTICS_QUERY_KEYS.analytics.issues,
        maintenance: ANALYTICS_QUERY_KEYS.analytics.maintenance,
        energy: ANALYTICS_QUERY_KEYS.analytics.energy,
        optimization: ANALYTICS_QUERY_KEYS.analytics.optimization,
      }[type];

      if (queryKey) {
        await queryClient.invalidateQueries({ queryKey: queryKey as any });
      }
      
      return { success: true };
    } catch (error) {
      console.error(`Error refreshing ${type} analytics:`, error);
      return { success: false, error };
    }
  }, [queryClient]);

  const prefetchReport = useCallback((buildingId?: string) => {
    queryClient.prefetchQuery({
      queryKey: ANALYTICS_QUERY_KEYS.analytics.report(buildingId),
      queryFn: () => AdvancedAnalyticsService.generateFacilityReport(buildingId),
      ...ANALYTICS_CACHE_CONFIG.report,
    });
  }, [queryClient]);

  return {
    refreshAllAnalytics,
    refreshSpecificAnalytic,
    prefetchReport,
  };
}

/**
 * Hook for real-time analytics alerts
 * Monitors analytics data and provides alerts for critical conditions
 */
export function useAnalyticsAlerts(buildingId?: string) {
  const { summary } = useAnalyticsDashboard(buildingId);
  const { data: maintenance } = useMaintenanceAnalytics();
  const { data: optimization } = useSpaceOptimization();

  const alerts = useMemo(() => {
    if (!summary || !maintenance || !optimization) {
      return [];
    }

    const alertList: Array<{
      id: string;
      type: 'critical' | 'warning' | 'info';
      title: string;
      message: string;
      action?: string;
    }> = [];

    // Critical maintenance alerts
    if (summary.maintenance_summary.critical_count > 0) {
      alertList.push({
        id: 'critical-maintenance',
        type: 'critical',
        title: 'Critical Maintenance Required',
        message: `${summary.maintenance_summary.critical_count} spaces need immediate attention`,
        action: 'View maintenance schedule',
      });
    }

    // Low utilization warning
    if (summary.facility_overview.utilization_status === 'low') {
      alertList.push({
        id: 'low-utilization',
        type: 'warning',
        title: 'Low Space Utilization',
        message: `Average utilization is ${summary.facility_overview.average_utilization}%`,
        action: 'View optimization recommendations',
      });
    }

    // Issue resolution warning
    if (summary.issues_summary.resolution_status === 'needs_improvement') {
      alertList.push({
        id: 'resolution-rate',
        type: 'warning',
        title: 'Low Issue Resolution Rate',
        message: `Only ${summary.issues_summary.resolution_rate}% of issues are resolved`,
        action: 'Review issue management',
      });
    }

    // Energy efficiency info
    if (summary.energy_summary.potential_savings > 1000) {
      alertList.push({
        id: 'energy-savings',
        type: 'info',
        title: 'Energy Savings Opportunity',
        message: `Potential savings of $${summary.energy_summary.potential_savings.toLocaleString()}`,
        action: 'View energy report',
      });
    }

    return alertList;
  }, [summary, maintenance, optimization]);

  return {
    alerts,
    hasAlerts: alerts.length > 0,
    criticalAlerts: alerts.filter(a => a.type === 'critical'),
    warningAlerts: alerts.filter(a => a.type === 'warning'),
    infoAlerts: alerts.filter(a => a.type === 'info'),
  };
}

// Export all types and services
export {
  AdvancedAnalyticsService,
  type FacilityUtilizationData,
  type OccupancyTrendData,
  type IssueAnalyticsData,
  type MaintenanceAnalyticsData,
  type EnergyEfficiencyData,
  type SpaceOptimizationRecommendation,
};
