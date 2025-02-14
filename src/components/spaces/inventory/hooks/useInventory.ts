
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
      // First fetch inventory items
      const { data: items, error: itemsError } = await supabase
        .from('inventory_items')
        .select('id, name, quantity, description, minimum_quantity, unit, category_id, storage_room_id')
        .eq('storage_room_id', roomId);
      
      if (itemsError) throw itemsError;
      
      if (!items?.length) return [];

      // Then fetch categories separately
      const { data: categories, error: categoriesError } = await supabase
        .from('inventory_categories')
        .select('id, name, color')
        .in('id', items.map(item => item.category_id).filter(Boolean));

      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError);
      }

      // Create a lookup map for categories
      const categoryMap = (categories || []).reduce((acc, cat) => {
        acc[cat.id] = cat;
        return acc;
      }, {} as Record<string, { name: string; color: string }>);

      // Combine the data
      return items.map(item => ({
        ...item,
        category: item.category_id ? {
          name: categoryMap[item.category_id]?.name,
          color: categoryMap[item.category_id]?.color
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
