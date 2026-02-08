import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getErrorMessage } from "@/lib/errorUtils";
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";
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
      } catch (error) {
        logger.error("Error creating item:", error);
        throw new Error(getErrorMessage(error) || "Failed to create inventory item");
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
        description: getErrorMessage(error),
        variant: "destructive",
      });
    },
  });

  const bulkCreateMutation = useMutation({
    mutationFn: async (items: Array<Record<string, unknown>>) => {
      try {
        logger.debug('Bulk creating items:', items);

        // Transform items to ensure proper field mapping
        const transformedItems = items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          description: item.description || null,
          minimum_quantity: item.minimum_quantity || null,
          unit: item.unit || null,
          location_details: item.location_details || null,
          preferred_vendor: item.preferred_vendor || null,
          notes: item.notes || null,
          status: item.status || 'active',
          storage_room_id: roomId,
          category_id: item.category_id || null, // This is the key fix - use category_id not category
        }));

        logger.debug('Transformed items for database:', transformedItems);

        const { data, error } = await supabase
          .from("inventory_items")
          .insert(transformedItems)
          .select();

        if (error) {
          logger.error('Database error during bulk insert:', error);
          throw error;
        }

        logger.debug('Successfully inserted items:', data);
        return data;
      } catch (error) {
        logger.error("Error creating items:", error);
        throw new Error(getErrorMessage(error) || "Failed to create inventory items");
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["inventory", roomId] });
      toast({
        title: "Success",
        description: `Successfully imported ${data?.length || 0} items`,
      });
    },
    onError: (error: Error) => {
      logger.error('Bulk create mutation error:', error);
      toast({
        title: "Error",
        description: getErrorMessage(error),
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
      } catch (error) {
        logger.error("Error updating item:", error);
        throw new Error(getErrorMessage(error) || "Failed to update inventory item");
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
        description: getErrorMessage(error),
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
      } catch (error) {
        logger.error("Error deleting item:", error);
        throw new Error(getErrorMessage(error) || "Failed to delete inventory item");
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
        description: getErrorMessage(error),
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
