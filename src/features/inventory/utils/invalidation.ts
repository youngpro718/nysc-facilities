import type { QueryClient } from "@tanstack/react-query";

/**
 * Canonical list of query keys that depend on inventory stock levels.
 * Call invalidateInventoryStockQueries(queryClient) after any inventory write
 * to keep every panel in sync.
 */
export const INVENTORY_STOCK_QUERY_KEYS = [
  "inventory",
  "inventory-items",
  "inventory-items-all",
  "inventory-stats",
  "inventory-overview-items",
  "low-stock-items",
  "low-stock-overview",
  "out-of-stock-items",
  "storage-rooms",
  "court-aide-alerts",
  "adminNotifications",
] as const;

export function invalidateInventoryStockQueries(queryClient: QueryClient) {
  for (const key of INVENTORY_STOCK_QUERY_KEYS) {
    queryClient.invalidateQueries({ queryKey: [key] });
  }
}
