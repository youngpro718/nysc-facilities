
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { InventoryItem, InventoryFormInputs } from "../types/inventoryTypes";

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
          inventory_categories!category_id (
            id,
            name,
            color,
            icon
          )
        `)
        .eq('storage_room_id', roomId);
      
      if (error) throw error;
      
      if (!data?.length) return [];

      return data.map(item => ({
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
        storage_room_id: item.storage_room_id,
        category: item.inventory_categories ? {
          id: item.inventory_categories.id,
          name: item.inventory_categories.name,
          color: item.inventory_categories.color,
          icon: item.inventory_categories.icon
        } : undefined
      })) as InventoryItem[];
    }
  });

  const addItemMutation = useMutation({
    mutationFn: async (params: InventoryFormInputs) => {
      const { error } = await supabase
        .from('inventory_items')
        .insert({ 
          ...params,
          status: 'active'
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
