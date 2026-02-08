import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { OptimizedInventoryService } from '@/services/optimized/inventoryService';
import type {
  OptimizedInventoryItem,
  InventoryDashboardStats,
  OptimizedInventoryCategory,
} from '@/services/optimized/inventoryService';

// Query keys for consistent caching
export const inventoryQueryKeys = {
  all: ['optimized-inventory'] as const,
  dashboardStats: () => [...inventoryQueryKeys.all, 'dashboard-stats'] as const,
  allItems: () => [...inventoryQueryKeys.all, 'all-items'] as const,
  lowStock: () => [...inventoryQueryKeys.all, 'low-stock'] as const,
  categories: () => [...inventoryQueryKeys.all, 'categories'] as const,
  search: (query: string) => [...inventoryQueryKeys.all, 'search', query] as const,
  byCategory: (categoryId: string) => [...inventoryQueryKeys.all, 'by-category', categoryId] as const,
};

/**
 * Hook for inventory dashboard statistics with optimized caching
 */
export function useInventoryDashboardStats() {
  return useQuery({
    queryKey: inventoryQueryKeys.dashboardStats(),
    queryFn: OptimizedInventoryService.getDashboardStats,
    staleTime: 4 * 60 * 1000, // 4 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

/**
 * Hook for all inventory items with optimized caching
 */
export function useOptimizedInventoryItems() {
  return useQuery({
    queryKey: inventoryQueryKeys.allItems(),
    queryFn: OptimizedInventoryService.getAllItems,
    staleTime: 4 * 60 * 1000, // 4 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

/**
 * Hook for low stock items with optimized caching
 */
export function useLowStockItems() {
  return useQuery({
    queryKey: inventoryQueryKeys.lowStock(),
    queryFn: OptimizedInventoryService.getLowStockItems,
    staleTime: 2 * 60 * 1000, // 2 minutes (more frequent updates for critical data)
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true, // Refetch on focus for critical data
    retry: 3,
  });
}

/**
 * Hook for inventory categories with item counts
 */
export function useInventoryCategories() {
  return useQuery({
    queryKey: inventoryQueryKeys.categories(),
    queryFn: OptimizedInventoryService.getCategories,
    staleTime: 5 * 60 * 1000, // 5 minutes (categories change less frequently)
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

/**
 * Hook for searching inventory items with debounced queries
 */
export function useInventorySearch(query: string, enabled: boolean = true) {
  return useQuery({
    queryKey: inventoryQueryKeys.search(query),
    queryFn: () => OptimizedInventoryService.searchItems(query),
    enabled: enabled && query.length >= 2, // Only search with 2+ characters
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

/**
 * Hook for items by category with optimized caching
 */
export function useInventoryItemsByCategory(categoryId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: inventoryQueryKeys.byCategory(categoryId),
    queryFn: () => OptimizedInventoryService.getItemsByCategory(categoryId),
    enabled: enabled && !!categoryId,
    staleTime: 4 * 60 * 1000, // 4 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

/**
 * Hook for inventory analytics with computed metrics
 */
export function useInventoryAnalytics() {
  const { data: stats, isLoading: statsLoading } = useInventoryDashboardStats();
  const { data: categories, isLoading: categoriesLoading } = useInventoryCategories();
  const { data: lowStockItems, isLoading: lowStockLoading } = useLowStockItems();

  const analytics = {
    // Basic stats
    totalItems: stats?.total_items || 0,
    totalValue: stats?.total_value || 0,
    lowStockCount: stats?.low_stock_count || 0,
    outOfStockCount: stats?.out_of_stock_count || 0,
    categoriesCount: stats?.categories_count || 0,
    recentlyUpdatedCount: stats?.recently_updated_count || 0,

    // Computed metrics
    lowStockPercentage: stats ? Math.round((stats.low_stock_count / stats.total_items) * 100) : 0,
    outOfStockPercentage: stats ? Math.round((stats.out_of_stock_count / stats.total_items) * 100) : 0,
    averageItemsPerCategory: stats && stats.categories_count > 0 
      ? Math.round(stats.total_items / stats.categories_count) 
      : 0,

    // Category analytics
    categoryAnalytics: categories?.map(cat => ({
      name: cat.name,
      itemCount: cat.item_count,
      lowStockItems: cat.low_stock_items,
      totalQuantity: cat.total_quantity,
      lowStockPercentage: cat.item_count > 0 
        ? Math.round((cat.low_stock_items / cat.item_count) * 100) 
        : 0,
    })) || [],

    // Critical items that need immediate attention
    criticalItems: lowStockItems?.filter(item => item.quantity === 0) || [],
    
    // Items that will be critical soon
    warningItems: lowStockItems?.filter(item => 
      item.quantity > 0 && item.quantity <= item.minimum_quantity * 0.5
    ) || [],
  };

  return {
    data: analytics,
    isLoading: statsLoading || categoriesLoading || lowStockLoading,
    isError: false, // Individual hooks handle their own errors
  };
}

/**
 * Real-time inventory updates hook
 */
export function useInventoryRealtimeSync() {
  const queryClient = useQueryClient();

  React.useEffect(() => {
    const channel = supabase
      .channel('inventory-realtime-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory_items'
        },
        (payload) => {
          logger.debug('Inventory changed:', payload);
          // Invalidate all inventory-related queries
          queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.all });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory_item_transactions'
        },
        (payload) => {
          logger.debug('Inventory transaction recorded:', payload);
          // Refresh items and stats when transactions occur
          queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.allItems() });
          queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.dashboardStats() });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

/**
 * Cache management utilities
 */
export function useInventoryCacheManager() {
  const queryClient = useQueryClient();

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.all });
  };

  const refreshDashboard = () => {
    queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.dashboardStats() });
  };

  const refreshItems = () => {
    queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.allItems() });
  };

  const refreshLowStock = () => {
    queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.lowStock() });
  };

  const refreshCategories = () => {
    queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.categories() });
  };

  const prefetchItems = () => {
    queryClient.prefetchQuery({
      queryKey: inventoryQueryKeys.allItems(),
      queryFn: OptimizedInventoryService.getAllItems,
      staleTime: 4 * 60 * 1000,
    });
  };

  const prefetchLowStock = () => {
    queryClient.prefetchQuery({
      queryKey: inventoryQueryKeys.lowStock(),
      queryFn: OptimizedInventoryService.getLowStockItems,
      staleTime: 2 * 60 * 1000,
    });
  };

  return {
    refreshAll,
    refreshDashboard,
    refreshItems,
    refreshLowStock,
    refreshCategories,
    prefetchItems,
    prefetchLowStock,
  };
}

/**
 * Debounced search hook for inventory items
 */
export function useDebouncedInventorySearch(query: string, delay: number = 300) {
  const [debouncedQuery, setDebouncedQuery] = React.useState(query);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [query, delay]);

  return useInventorySearch(debouncedQuery, debouncedQuery.length >= 2);
}

// Re-export types for convenience
export type {
  OptimizedInventoryItem,
  InventoryDashboardStats,
  OptimizedInventoryCategory,
};
