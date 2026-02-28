import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFavoriteItems } from '@/hooks/useFavoriteItems';
import { useInventoryItems } from '@/hooks/useInventoryItems';
import { useIsMobile } from '@/hooks/use-mobile';
import type { CartItem } from '@/hooks/useOrderCart';

interface FavoritesStripProps {
  cartItems: CartItem[];
  onAdd: (item: any) => void;
  onIncrement: (item: any) => void;
  onDecrement: (item: any) => void;
}

export function FavoritesStrip({
  cartItems,
  onAdd,
  onIncrement,
  onDecrement,
}: FavoritesStripProps) {
  const { favorites, isLoading: favoritesLoading } = useFavoriteItems();
  const { data: inventoryItems = [], isLoading: itemsLoading } = useInventoryItems();
  const isMobile = useIsMobile();

  // Get favorite items with their full details
  const favoriteItems = favorites
    .map(fav => inventoryItems.find((item: any) => item.id === fav.item_id))
    .filter(Boolean) as Record<string, any>[];

  if (favoritesLoading || itemsLoading) {
    return null;
  }

  if (favoriteItems.length === 0) {
    return (
      <div className="flex items-center gap-2 py-1.5 px-2 bg-muted/50 rounded-lg text-xs text-muted-foreground">
        <Star className="h-3.5 w-3.5 shrink-0" />
        <span>Star items for quick access</span>
      </div>
    );
  }

  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex items-center gap-1.5 pb-1">
        <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500 shrink-0" />
        {favoriteItems.map((item) => {
          const cartItem = cartItems.find((c) => c.item_id === item.id);
          const quantity = cartItem?.quantity || 0;
          const inCart = quantity > 0;

          return (
            <div
              key={item.id}
              className={cn(
                "flex items-center gap-1 rounded-full border px-2 transition-all shrink-0",
                isMobile ? "h-9" : "h-8",
                inCart
                  ? "bg-primary/10 border-primary/30"
                  : "bg-card hover:bg-accent/50"
              )}
            >
              {inCart ? (
                <>
                  <button
                    className="p-0.5 rounded-full touch-manipulation active:scale-90"
                    onClick={() => onDecrement(item)}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-xs font-bold tabular-nums min-w-[1.25rem] text-center">
                    {quantity}
                  </span>
                  <button
                    className="p-0.5 rounded-full touch-manipulation active:scale-90"
                    onClick={() => onIncrement(item)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </>
              ) : (
                <button
                  className="flex items-center gap-1 touch-manipulation active:scale-95"
                  onClick={() => onAdd(item)}
                >
                  <Plus className="h-3 w-3" />
                  <span className="text-xs font-medium max-w-[80px] truncate">
                    {item.name}
                  </span>
                </button>
              )}
              {inCart && (
                <span className="text-[10px] font-medium max-w-[60px] truncate text-muted-foreground">
                  {item.name}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
