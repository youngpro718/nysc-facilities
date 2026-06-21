import { useQuery } from '@tanstack/react-query';
import { getCatalogItems, CatalogItem } from '@features/supply/services/unifiedSupplyService';

/**
 * User-facing supply catalog. Returns CatalogItem[] from the inventory_catalog
 * view — no raw stock quantity, just a derived stock_status chip value.
 * Admin inventory pages should keep using useInventoryItems().
 */
export function useCatalogItems() {
  return useQuery<CatalogItem[]>({
    queryKey: ['supply-catalog'],
    queryFn: getCatalogItems,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
  });
}
