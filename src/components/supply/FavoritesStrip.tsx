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
    .filter(Boolean) as any[];

  if (favoritesLoading || itemsLoading) {
    return null;
  }

  if (favoriteItems.length === 0) {
    return (
      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
        <Star className="h-4 w-4" />
        <span>Star items to add them to your favorites for quick access</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
        <span className="text-sm font-medium">Favorites</span>
      </div>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-2 pb-2">
          {favoriteItems.map((item) => {
            const cartItem = cartItems.find((c) => c.item_id === item.id);
            const quantity = cartItem?.quantity || 0;
            const inCart = quantity > 0;

            return (
              <div
                key={item.id}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-lg border transition-all",
                  isMobile ? "min-w-[110px]" : "min-w-[100px]",
                  inCart
                    ? "bg-primary/10 border-primary/30"
                    : "bg-card hover:bg-accent/50"
                )}
              >
                <span className="text-xs font-medium text-center line-clamp-2 h-8">
                  {item.name}
                </span>
                
                {inCart ? (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "rounded-full touch-manipulation",
                        isMobile ? "h-9 w-9" : "h-7 w-7"
                      )}
                      onClick={() => onDecrement(item)}
                    >
                      <Minus className={isMobile ? "h-4 w-4" : "h-3 w-3"} />
                    </Button>
                    <Badge variant="secondary" className="min-w-[24px] justify-center">
                      {quantity}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "rounded-full touch-manipulation",
                        isMobile ? "h-9 w-9" : "h-7 w-7"
                      )}
                      onClick={() => onIncrement(item)}
                    >
                      <Plus className={isMobile ? "h-4 w-4" : "h-3 w-3"} />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "text-xs touch-manipulation",
                      isMobile ? "h-9 px-3" : "h-7"
                    )}
                    onClick={() => onAdd(item)}
                  >
                    <Plus className={isMobile ? "h-4 w-4 mr-1" : "h-3 w-3 mr-1"} />
                    Add
                  </Button>
                )}
              </div>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
