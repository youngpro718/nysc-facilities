    import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  minimum_quantity?: number;
  category_id?: string;
  category?: {
    id: string;
    name: string;
    color?: string;
  };
  description?: string;
  unit?: string;
  location_details?: string;
  status?: "available" | "low_stock" | "out_of_stock";
  storage_room_id?: string;
  updated_at?: string;
  created_at?: string;
  photo_url?: string;
}

interface UseInventoryOptions {
  roomId?: string;
  enabled?: boolean;
}

export function useInventory({ roomId, enabled = true }: UseInventoryOptions = {}) {
  const queryClient = useQueryClient();

  const { data: items, isLoading, error } = useQuery({
    queryKey: ["inventory", roomId],
    queryFn: async () => {
      try {
        let query = supabase
          .from("inventory_items")
          .select(`
            *,
            inventory_categories (
              id,
              name,
              color
            )
          `);

        if (roomId) {
          query = query.eq("storage_room_id", roomId);
        }

        const { data, error } = await query;

        if (error) throw error;

        return data.map((item) => ({
          ...item,
          category: item.inventory_categories
            ? {
                id: item.inventory_categories.id,
                name: item.inventory_categories.name,
                color: item.inventory_categories.color,
              }
            : undefined,
        })) as InventoryItem[];
      } catch (error: any) {
        console.error("Error fetching inventory:", error);
        throw new Error(error.message || "Failed to fetch inventory items");
      }
    },
    enabled,
    staleTime: 4 * 60 * 1000, // 4 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
  });

  const createMutation = useMutation({
    mutationFn: async (newItem: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>) => {
      try {
        // Filter out category object since it's not in the database schema
        const { category, ...itemData } = newItem;
        
        const { data, error } = await supabase
          .from("inventory_items")
          .insert([{ ...itemData, storage_room_id: roomId, category_id: category?.id }])
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
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
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

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<InventoryItem> & { id: string }) => {
      try {
        const { id, category, ...updates } = data;
        const { data: updatedData, error } = await supabase
          .from("inventory_items")
          .update({ ...updates, category_id: category?.id })
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
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
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
          .delete()
          .eq("id", id);

        if (error) throw error;
      } catch (error: any) {
        console.error("Error deleting item:", error);
        throw new Error(error.message || "Failed to delete inventory item");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
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

  return {
    items: items || [],
    isLoading,
    error,
    createItem: createMutation.mutateAsync,
    updateItem: updateMutation.mutateAsync,
    deleteItem: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
