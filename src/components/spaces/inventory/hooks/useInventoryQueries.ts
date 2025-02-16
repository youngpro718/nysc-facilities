
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { InventoryItem, InventoryCategory, InventoryTransaction } from "../types/inventoryTypes";

export const useInventoryQueries = (roomId: string) => {
  const inventoryQuery = useQuery({
    queryKey: ['inventory', roomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_items')
        .select(`
          *,
          category:inventory_categories (
            name,
            color,
            icon,
            description
          )
        `)
        .eq('storage_room_id', roomId)
        .eq('status', 'active');
      
      if (error) throw error;
      return data as InventoryItem[];
    }
  });

  const categoriesQuery = useQuery({
    queryKey: ['inventory-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as InventoryCategory[];
    }
  });

  const transactionsQuery = useQuery({
    queryKey: ['inventory-transactions', roomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_item_transactions')
        .select(`
          *,
          inventory_items (name)
        `)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as InventoryTransaction[];
    }
  });

  const lowStockQuery = useQuery({
    queryKey: ['inventory-low-stock', roomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_items')
        .select(`
          *,
          category:inventory_categories (
            name,
            color,
            icon,
            description
          )
        `)
        .eq('storage_room_id', roomId)
        .eq('status', 'active')
        .not('minimum_quantity', 'is', null)  // Only items with minimum_quantity set
        .filter('quantity', 'lte', 'minimum_quantity::integer');  // Compare with the column value
      
      if (error) throw error;
      return data as InventoryItem[];
    }
  });

  return {
    inventory: {
      data: inventoryQuery.data ?? [],
      isLoading: inventoryQuery.isLoading,
      error: inventoryQuery.error
    },
    categories: {
      data: categoriesQuery.data ?? [],
      isLoading: categoriesQuery.isLoading,
      error: categoriesQuery.error
    },
    transactions: {
      data: transactionsQuery.data ?? [],
      isLoading: transactionsQuery.isLoading,
      error: transactionsQuery.error
    },
    lowStock: {
      data: lowStockQuery.data ?? [],
      isLoading: lowStockQuery.isLoading,
      error: lowStockQuery.error
    }
  };
};
