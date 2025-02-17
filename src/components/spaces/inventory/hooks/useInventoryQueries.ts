
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
          id,
          name,
          quantity,
          minimum_quantity,
          description,
          unit,
          status,
          category_id,
          storage_room_id,
          inventory_categories!category_id (
            id,
            name,
            color,
            icon
          )
        `)
        .eq('storage_room_id', roomId)
        .eq('status', 'active');
      
      if (error) throw error;

      // Transform the response to match our frontend types
      const transformedData = data.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        category_id: item.category_id,
        description: item.description,
        minimum_quantity: item.minimum_quantity,
        unit: item.unit,
        status: item.status,
        storage_room_id: item.storage_room_id,
        category: item.inventory_categories ? {
          id: item.inventory_categories.id,
          name: item.inventory_categories.name,
          color: item.inventory_categories.color,
          icon: item.inventory_categories.icon
        } : undefined
      }));

      return transformedData as InventoryItem[];
    }
  });

  const categoriesQuery = useQuery({
    queryKey: ['inventory-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_categories')
        .select('id, name, color, icon')
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
          id,
          transaction_type,
          quantity,
          created_at,
          item:inventory_items!item_id (
            id,
            name
          )
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
          id,
          name,
          quantity,
          minimum_quantity,
          description,
          unit,
          status,
          category_id,
          storage_room_id,
          inventory_categories!category_id (
            id,
            name,
            color,
            icon
          )
        `)
        .eq('storage_room_id', roomId)
        .eq('status', 'active')
        .not('minimum_quantity', 'is', null)
        .gte('minimum_quantity', 0)
        .filter('quantity', 'lte', 'minimum_quantity');
      
      if (error) throw error;

      // Transform the response to match our frontend types
      const transformedData = data.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        category_id: item.category_id,
        description: item.description,
        minimum_quantity: item.minimum_quantity,
        unit: item.unit,
        status: item.status,
        storage_room_id: item.storage_room_id,
        category: item.inventory_categories ? {
          id: item.inventory_categories.id,
          name: item.inventory_categories.name,
          color: item.inventory_categories.color,
          icon: item.inventory_categories.icon
        } : undefined
      }));

      return transformedData as InventoryItem[];
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
