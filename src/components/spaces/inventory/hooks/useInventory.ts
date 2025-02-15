
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { InventoryItem, InventoryTransaction } from "../types";

interface AddItemParams {
  name: string;
  quantity: number;
  categoryId: string;
  description?: string;
  minimum_quantity?: number;
  unit?: string;
  location_details?: string;
  reorder_point?: number;
  preferred_vendor?: string;
  notes?: string;
}

interface UpdateQuantityParams {
  id: string;
  quantity: number;
  notes?: string;
}

interface TransferItemParams {
  id: string;
  quantity: number;
  toRoomId: string;
  notes?: string;
}

type DatabaseInventoryItem = {
  id: string;
  name: string;
  quantity: number;
  category_id: string;
  description?: string;
  minimum_quantity?: number;
  unit?: string;
  status: string;
  location_details?: string;
  last_inventory_date?: string;
  reorder_point?: number;
  preferred_vendor?: string;
  notes?: string;
  category_name: string;
  category_color: string;
  category_icon?: string;
  category_description?: string;
};

type LowStockItem = {
  id: string;
  name: string;
  quantity: number;
  minimum_quantity: number;
  category_id: string;
  category_name: string;
  room_name: string | null;
  storage_location: string | null;
};

export const useInventory = (roomId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: inventoryData, isLoading } = useQuery({
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

  const { data: lowStockData } = useQuery<LowStockItem[]>({
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

  const lowStockItems = (lowStockData || []).map(item => ({
    id: item.id,
    name: item.name,
    quantity: item.quantity || 0,
    minimum_quantity: item.minimum_quantity || 0,
    category_id: item.category_id,
    category_name: item.category_name,
    room_id: roomId,
    room_name: item.room_name || '',
    storage_location: item.storage_location || ''
  }));

  const { data: transactionData } = useQuery({
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

  const recentTransactions = (transactionData || []).map(transaction => ({
    id: transaction.id,
    item_id: transaction.item_id || '',
    transaction_type: transaction.transaction_type as "add" | "remove" | "adjust" | "transfer",
    quantity: transaction.quantity,
    from_room_id: transaction.from_room_id || undefined,
    to_room_id: transaction.to_room_id || undefined,
    notes: transaction.notes || undefined,
    created_at: transaction.created_at
  }));

  const addItemMutation = useMutation({
    mutationFn: async (params: AddItemParams) => {
      const { error } = await supabase
        .from('inventory_items')
        .insert({ 
          name: params.name, 
          quantity: params.quantity, 
          storage_room_id: roomId,
          category_id: params.categoryId,
          description: params.description,
          minimum_quantity: params.minimum_quantity,
          unit: params.unit,
          location_details: params.location_details,
          reorder_point: params.reorder_point,
          preferred_vendor: params.preferred_vendor,
          notes: params.notes,
          status: 'active',
          last_inventory_date: new Date().toISOString()
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', roomId] });
      toast({
        title: "Item added",
        description: "The item has been successfully added.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add item. Please try again.",
        variant: "destructive",
      });
      console.error('Error adding item:', error);
    },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity, notes }: UpdateQuantityParams) => {
      const { error } = await supabase.rpc('safely_update_inventory_quantity', {
        p_item_id: id,
        p_new_quantity: quantity,
        p_performed_by: null // Will be set by RLS
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', roomId] });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'transactions', roomId] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update quantity. Please try again.",
        variant: "destructive",
      });
      console.error('Error updating quantity:', error);
    },
  });

  const transferItemMutation = useMutation({
    mutationFn: async ({ id, quantity, toRoomId, notes }: TransferItemParams) => {
      const { error } = await supabase
        .from('inventory_transactions')
        .insert({
          item_id: id,
          transaction_type: 'transfer',
          quantity,
          from_room_id: roomId,
          to_room_id: toRoomId,
          notes
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', roomId] });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'transactions', roomId] });
      toast({
        title: "Item transferred",
        description: "The item has been successfully transferred.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to transfer item. Please try again.",
        variant: "destructive",
      });
      console.error('Error transferring item:', error);
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('inventory_items')
        .update({ status: 'inactive' })
        .eq('id', itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', roomId] });
      toast({
        title: "Item deleted",
        description: "The item has been successfully deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete item. Please try again.",
        variant: "destructive",
      });
      console.error('Error deleting item:', error);
    },
  });

  return {
    inventoryData: inventoryData || [],
    isLoading,
    lowStockItems,
    recentTransactions,
    addItemMutation,
    updateQuantityMutation,
    transferItemMutation,
    deleteItemMutation
  };
};
