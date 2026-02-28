import { useFavoriteItems } from '@/hooks/useFavoriteItems';
import { ItemRow } from './ItemRow';
import { Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FavoritesTabProps {
  cartItems: Record<string, any>[];
  selectedItemId: string | null;
  onSelectItem: (itemId: string) => void;
  onAddItem: (item: any) => void;
  onIncrement: (item: any) => void;
  onDecrement: (item: any) => void;
}

export function FavoritesTab({
  cartItems,
  selectedItemId,
  onSelectItem,
  onAddItem,
  onIncrement,
  onDecrement,
}: FavoritesTabProps) {
  const { favorites, isLoading } = useFavoriteItems();

  const getCartQuantity = (itemId: string) => {
    const cartItem = cartItems.find(item => item.item_id === itemId);
    return cartItem?.quantity || 0;
  };

  const handleAddAll = () => {
    favorites.forEach(fav => {
      if (fav.inventory_items) {
        onAddItem(fav.inventory_items);
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-8">
        <Star className="h-12 w-12 text-muted-foreground opacity-20 mb-3" />
        <p className="text-sm font-medium mb-1">No favorites yet</p>
        <p className="text-xs text-muted-foreground">
          Click the star icon on items to add them to your favorites
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-4 py-2">
        <h3 className="text-sm font-medium">
          {favorites.length} Favorite Item{favorites.length !== 1 ? 's' : ''}
        </h3>
        <Button size="sm" variant="outline" onClick={handleAddAll}>
          Add All to Cart
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden bg-card">
        <div className="max-h-[600px] overflow-y-auto">
          {favorites.map((fav) => {
            const item = fav.inventory_items;
            if (!item) return null;

            return (
              <ItemRow
                key={item.id}
                item={item}
                cartQuantity={getCartQuantity(item.id)}
                isSelected={selectedItemId === item.id}
                onSelect={() => onSelectItem(item.id)}
                onAddToCart={() => onAddItem(item)}
                onIncrement={() => onIncrement(item)}
                onDecrement={() => onDecrement(item)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
