
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DatabaseInventoryItem, InventoryItem, RawLowStockData, InventoryTransactionType } from "../types/inventoryTypes";

export const useInventoryQueries = (roomId: string) => {
  const { data: inventoryData, isLoading } = useQuery<InventoryItem[], Error>({
    queryKey: ['inventory', roomId] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_items_view')
        .select()
        .eq('storage_room_id', roomId)
        .eq('status', 'active');
      
      if (error) throw error;
      
      return (data || []).map((item: DatabaseInventoryItem): InventoryItem => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        category_id: item.category_id,
        description: item.description,
        minimum_quantity: item.minimum_quantity,
        unit: item.unit,
        status: item.status,
        location_details: item.location_details,
        last_inventory_date: item.last_inventory_date,
        reorder_point: item.reorder_point,
        preferred_vendor: item.preferred_vendor,
        notes: item.notes,
        category: item.category_name ? {
          name: item.category_name,
          color: item.category_color,
          icon: item.category_icon,
          description: item.category_description
        } : undefined
      }));
    }
  });

  const lowStockQuery = useQuery<RawLowStockData[], Error>({
    queryKey: ['inventory', 'low-stock', roomId] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('low_stock_items')
        .select()
        .eq('room_id', roomId);
      
      if (error) throw error;
      return data || [];
    }
  });

  const { data: transactionData } = useQuery<InventoryTransactionType[], Error>({
    queryKey: ['inventory', 'transactions', roomId] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_transactions')
        .select()
        .eq('from_room_id', roomId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    }
  });

  return {
    inventoryData: inventoryData ?? [],
    isLoading,
    lowStockData: lowStockQuery.data ?? [],
    transactionData: transactionData ?? []
  };
};
