
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { InventoryItem, InventoryFormInputs } from "../types/inventoryTypes";

export function useInventory(roomId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: inventory, isLoading } = useQuery({
    queryKey: ['inventory', roomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_items')
        .select(`
          *,
          inventory_categories (
            id,
            name,
            color,
            icon
          )
        `)
        .eq('storage_room_id', roomId)
        .eq('status', 'active');
      
      if (error) throw error;

      return data.map(item => ({
        ...item,
        category: item.inventory_categories
          ? {
              id: item.inventory_categories.id,
              name: item.inventory_categories.name,
              color: item.inventory_categories.color,
            }
          : undefined,
      })) as InventoryItem[];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (newItem: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>) => {
      try {
        const { category, ...itemData } = newItem;
        
        const { data, error } = await supabase
          .from("inventory_items")
          .insert([{ ...itemData, storage_room_id: roomId }])
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (error: any) {
        console.error("Error creating item:", error);
        throw new Error(error.message || "Failed to create inventory item");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory", roomId] });
      toast({
        title: "Success",
        description: "Item created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const bulkCreateMutation = useMutation({
    mutationFn: async (items: Array<Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>>) => {
      try {
        const { error } = await supabase
          .from("inventory_items")
          .insert(
            items.map(item => ({
              ...item,
              storage_room_id: roomId,
              status: 'active'
            }))
          );

        if (error) throw error;
      } catch (error: any) {
        console.error("Error creating items:", error);
        throw new Error(error.message || "Failed to create inventory items");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory", roomId] });
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
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<InventoryItem> & { id: string }) => {
      try {
        const { id, category, ...updates } = data;
        const { data: updatedData, error } = await supabase
          .from("inventory_items")
          .update({ ...updates })
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;
        return updatedData;
      } catch (error: any) {
        console.error("Error updating item:", error);
        throw new Error(error.message || "Failed to update inventory item");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory", roomId] });
      toast({
        title: "Success",
        description: "Item updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        const { error } = await supabase
          .from("inventory_items")
          .update({ status: 'inactive' })
          .eq("id", id);

        if (error) throw error;
      } catch (error: any) {
        console.error("Error deleting item:", error);
        throw new Error(error.message || "Failed to delete inventory item");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory", roomId] });
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
    },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      const { error } = await supabase
        .from("inventory_items")
        .update({ quantity })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory", roomId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to update quantity",
        variant: "destructive",
      });
    },
  });

  return {
    inventory,
    isLoading,
    addItem: createMutation.mutateAsync,
    addBulkItems: bulkCreateMutation.mutateAsync,
    editItem: updateMutation.mutateAsync,
    updateQuantity: updateQuantityMutation.mutateAsync,
    deleteItem: deleteMutation.mutateAsync,
    isAddingItem: createMutation.isPending,
    isEditingItem: updateMutation.isPending,
    isUpdatingQuantity: updateQuantityMutation.isPending,
    isDeletingItem: deleteMutation.isPending,
  };
}
