// Favorite Items — user supply item bookmarks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/errorUtils';
export function useFavoriteItems() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's favorite items
  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ['favorite-items', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_favorite_items')
        .select(`
          *,
          inventory_items (
            *,
            inventory_categories (id, name)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Check if an item is favorited
  const isFavorite = (itemId: string) => {
    return favorites.some(fav => fav.item_id === itemId);
  };

  // Add to favorites
  const addFavorite = useMutation({
    mutationFn: async (itemId: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('user_favorite_items')
        .insert({ user_id: user.id, item_id: itemId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorite-items'] });
      toast({
        title: 'Added to favorites',
        description: 'Item has been added to your favorites',
      });
    },
    onError: (error: unknown) => {
      toast({
        title: 'Error',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    },
  });

  // Remove from favorites
  const removeFavorite = useMutation({
    mutationFn: async (itemId: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('user_favorite_items')
        .delete()
        .eq('user_id', user.id)
        .eq('item_id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorite-items'] });
      toast({
        title: 'Removed from favorites',
        description: 'Item has been removed from your favorites',
      });
    },
    onError: (error: unknown) => {
      toast({
        title: 'Error',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    },
  });

  // Toggle favorite status
  const toggleFavorite = async (itemId: string) => {
    if (isFavorite(itemId)) {
      await removeFavorite.mutateAsync(itemId);
    } else {
      await addFavorite.mutateAsync(itemId);
    }
  };

  return {
    favorites,
    isLoading,
    isFavorite,
    addFavorite: addFavorite.mutateAsync,
    removeFavorite: removeFavorite.mutateAsync,
    toggleFavorite,
  };
}
