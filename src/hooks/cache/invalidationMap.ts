import { QueryClient } from '@tanstack/react-query';
import { inventoryQueryKeys } from '@/hooks/optimized/useOptimizedInventory';

// A React Query key can be an array or a simple string used in some legacy places
export type AnyQueryKey = string | readonly unknown[];

// Centralized mapping from DB tables to related React Query keys that should be invalidated
export const tableInvalidationMap: Record<string, AnyQueryKey[]> = {
  // Inventory core tables
  inventory_items: [
    // Optimized inventory keys
    inventoryQueryKeys.all,
    inventoryQueryKeys.allItems(),
    inventoryQueryKeys.lowStock(),
    inventoryQueryKeys.categories(),
    inventoryQueryKeys.dashboardStats(),
    // Common legacy/feature keys still present in codebase
    ['inventory'],
    ['inventory-items'],
    ['inventory-stats'],
    ['inventory-analytics'],
    ['low-stock-overview'],
    ['low-stock-items'],
    ['out-of-stock-items'],
    ['inventory-categories-with-counts'],
    ['categories'],
    ['recent-transactions'],
  ],
  // Lighting core tables
  lighting_fixtures: [
    ['lighting-fixtures'],
    ['room-lighting-stats'],
    ['lighting-status-report'],
  ],
  lighting_zones: [
    ['lighting-fixtures'],
  ],
  spatial_assignments: [
    ['lighting-fixtures'],
    ['room-lighting-stats'],
  ],
  rooms: [
    ['lighting-fixtures'],
    ['room-lighting-stats'],
  ],
  unified_spaces: [
    ['lighting-fixtures'],
    ['room-lighting-stats'],
  ],
  lighting_issues: [
    ['lighting-issues-report'],
  ],
  inventory_item_transactions: [
    inventoryQueryKeys.all,
    inventoryQueryKeys.allItems(),
    inventoryQueryKeys.lowStock(),
    inventoryQueryKeys.dashboardStats(),
    ['inventory-transactions'],
    ['inventory-stats'],
    ['inventory-analytics'],
    ['recent-transactions'],
    ['inventory'],
  ],
  inventory_categories: [
    inventoryQueryKeys.categories(),
    inventoryQueryKeys.all,
    inventoryQueryKeys.allItems(),
    inventoryQueryKeys.lowStock(),
    inventoryQueryKeys.dashboardStats(),
    ['categories'],
    ['inventory-categories-with-counts'],
    ['inventory-stats'],
    ['inventory-analytics'],
    ['inventory'],
  ],
};

export function getInvalidationKeysForTable(table: string): AnyQueryKey[] {
  return tableInvalidationMap[table] || [];
}

export async function invalidateForTable(queryClient: QueryClient, table: string) {
  const keys = getInvalidationKeysForTable(table);
  for (const key of keys) {
    if (Array.isArray(key)) {
      await queryClient.invalidateQueries({ queryKey: key as readonly unknown[] });
    } else {
      await queryClient.invalidateQueries({ queryKey: [key] });
    }
  }
}
