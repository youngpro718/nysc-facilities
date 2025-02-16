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
        .from('inventory_items')
        .select(`
          *,
          category:category_id (
            name,
            color
          )
        `)
        .eq('storage_room_id', roomId);
      
      if (error) throw error;
      
      if (!data?.length) return [];

      return data.map(item => ({
        ...item,
        category: item.category ? {
          name: item.category.name,
          color: item.category.color
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
        title: "Success",
        description: "Item added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add item",
        variant: "destructive",
      });
    },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      // First, update the local cache optimistically
      queryClient.setQueryData(['inventory', roomId], (oldData: InventoryItem[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(item => 
          item.id === id ? { ...item, quantity } : item
        );
      });

      try {
        const { error } = await supabase
          .from('inventory_items')
          .update({ quantity })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
      } catch (error) {
        // If the update fails, revert the optimistic update
        queryClient.invalidateQueries({ queryKey: ['inventory', roomId] });
        throw error;
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update quantity",
        variant: "destructive",
      });
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
        title: "Success",
        description: "Item deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete item",
        variant: "destructive",
      });
    },
  });

  return {
    inventoryData,
    isLoading,
    addItem: addItemMutation.mutateAsync,
    updateQuantity: updateQuantityMutation.mutateAsync,
    deleteItem: deleteItemMutation.mutateAsync,
    isAdding: addItemMutation.isPending,
    isUpdating: updateQuantityMutation.isPending,
    isDeleting: deleteItemMutation.isPending
  };
};
