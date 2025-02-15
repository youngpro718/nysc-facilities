
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AddItemParams, UpdateQuantityParams, TransferItemParams } from "../types/inventoryTypes";

export const useInventoryMutations = (roomId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
        p_notes: notes,
        p_performed_by: null
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
    addItemMutation,
    updateQuantityMutation,
    transferItemMutation,
    deleteItemMutation
  };
};
