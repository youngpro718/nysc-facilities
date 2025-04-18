
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { InventoryFormInputs, BatchUpdateInput } from "../types/inventoryTypes";

export const useInventoryMutations = (roomId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const addItemMutation = useMutation({
    mutationFn: async (params: InventoryFormInputs) => {
      const { error } = await supabase
        .from('inventory_items')
        .insert({ 
          ...params,
          storage_room_id: roomId,
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
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to add item. Please try again.",
        variant: "destructive",
      });
      console.error('Error adding item:', error);
    },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity, notes }: { id: string; quantity: number; notes?: string }) => {
      const { error } = await supabase.rpc('safely_update_inventory_quantity', {
        p_item_id: id,
        p_new_quantity: quantity,
        p_performed_by: null,
        p_notes: notes || 'Quantity update',
        p_status: 'active'
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', roomId] });
      queryClient.invalidateQueries({ queryKey: ['inventory-transactions', roomId] });
      toast({
        title: "Quantity updated",
        description: "The item quantity has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to update quantity. Please try again.",
        variant: "destructive",
      });
      console.error('Error updating quantity:', error);
    },
  });

  const batchUpdateMutation = useMutation({
    mutationFn: async ({ items, notes }: BatchUpdateInput) => {
      for (const item of items) {
        const { error } = await supabase.rpc('safely_update_inventory_quantity', {
          p_item_id: item.id,
          p_new_quantity: item.quantity,
          p_performed_by: null,
          p_notes: notes,
          p_status: 'active'
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', roomId] });
      queryClient.invalidateQueries({ queryKey: ['inventory-transactions', roomId] });
      toast({
        title: "Batch update complete",
        description: "All items have been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to update items. Please try again.",
        variant: "destructive",
      });
      console.error('Error in batch update:', error);
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
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to delete item. Please try again.",
        variant: "destructive",
      });
      console.error('Error deleting item:', error);
    },
  });

  return {
    addItemMutation,
    updateQuantityMutation,
    batchUpdateMutation,
    deleteItemMutation
  };
};
