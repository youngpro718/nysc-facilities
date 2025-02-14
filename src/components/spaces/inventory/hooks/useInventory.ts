import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { InventoryItem } from "../types";

interface AddItemParams {
  name: string;
  quantity: number;
  categoryId: string;
  description?: string;
  minimum_quantity?: number;
  unit?: string;
}

export const useInventory = (roomId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: inventoryData, isLoading } = useQuery({
    queryKey: ['inventory', roomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_items_view')
        .select()
        .eq('storage_room_id', roomId);
      
      if (error) throw error;
      
      if (!data?.length) return [];

      // Transform the data to match our InventoryItem type
      return data.map(item => ({
        ...item,
        category: item.category_id ? {
          name: item.category_name,
          color: item.category_color
        } : undefined
      })) as InventoryItem[];
    }
  });

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
          unit: params.unit
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
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      const { error } = await supabase
        .from('inventory_items')
        .update({ quantity })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', roomId] });
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

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('inventory_items')
        .delete()
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
    inventoryData,
    isLoading,
    addItemMutation,
    updateQuantityMutation,
    deleteItemMutation
  };
};
