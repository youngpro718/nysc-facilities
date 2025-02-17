
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { InventoryItem, InventoryTransaction } from "../types/inventoryTypes";

export const useInventory = (roomId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: inventory, isLoading } = useQuery({
    queryKey: ['inventory', roomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_items_view')
        .select('*')
        .eq('storage_room_id', roomId)
        .eq('status', 'active');

      if (error) throw error;
      return data as InventoryItem[];
    }
  });

  const addItem = useMutation({
    mutationFn: async (item: Omit<InventoryItem, 'id'>) => {
      const { data, error } = await supabase
        .from('inventory_items')
        .insert(item)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', roomId] });
      toast({
        title: "Success",
        description: "Item added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const addBulkItems = useMutation({
    mutationFn: async (items: Omit<InventoryItem, 'id'>[]) => {
      const { data, error } = await supabase
        .from('inventory_items')
        .insert(items)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', roomId] });
      toast({
        title: "Success",
        description: "Items imported successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const updateQuantity = useMutation({
    mutationFn: async ({ 
      id, 
      quantity,
      notes 
    }: { 
      id: string; 
      quantity: number; 
      notes?: string 
    }) => {
      const { error } = await supabase
        .rpc('safely_update_inventory_quantity', {
          p_item_id: id,
          p_new_quantity: quantity,
          p_notes: notes || 'Quantity update'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', roomId] });
      toast({
        title: "Success",
        description: "Quantity updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('inventory_items')
        .update({ status: 'inactive' })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', roomId] });
      toast({
        title: "Success",
        description: "Item deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  return {
    inventory,
    isLoading,
    addItem: addItem.mutateAsync,
    addBulkItems: addBulkItems.mutateAsync,
    updateQuantity: updateQuantity.mutateAsync,
    deleteItem: deleteItem.mutateAsync,
    isAddingItem: addItem.isPending,
    isUpdatingQuantity: updateQuantity.isPending,
    isDeletingItem: deleteItem.isPending
  };
};
