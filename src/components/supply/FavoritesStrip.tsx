/**
 * FavoritesStrip - Quick access to favorite items
 * 
 * Modern pill design with:
 * - Smooth animations
 * - Inline quantity controls
 * - Visual feedback
 */

import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Star, Plus, Minus, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFavoriteItems } from '@/hooks/useFavoriteItems';
import { useInventoryItems } from '@/hooks/useInventoryItems';
import { useIsMobile } from '@/hooks/use-mobile';
import type { CartItem } from '@/hooks/useOrderCart';
import { motion, AnimatePresence } from 'framer-motion';

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
      <div className="flex items-center gap-2.5 py-2 px-3 bg-gradient-to-r from-yellow-500/10 to-amber-500/5 rounded-xl border border-yellow-500/20">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500/20">
          <Sparkles className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Quick Add</p>
          <p className="text-xs text-yellow-600/70 dark:text-yellow-400/70">
            Star items for one-tap ordering
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-muted/50 to-transparent rounded-xl p-2">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex items-center gap-2 pb-0.5">
          <div className="flex items-center gap-1.5 px-2 shrink-0">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            <span className="text-xs font-medium text-muted-foreground">Favorites</span>
          </div>
          
          {favoriteItems.map((item) => {
            const cartItem = cartItems.find((c) => c.item_id === item.id);
            const quantity = cartItem?.quantity || 0;
            const inCart = quantity > 0;

            return (
              <motion.div
                key={item.id}
                layout
                className={cn(
                  "flex items-center gap-1.5 rounded-full border transition-all shrink-0",
                  isMobile ? "h-10 px-3" : "h-9 px-3",
                  inCart
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card hover:bg-accent/50 border-border"
                )}
              >
                <AnimatePresence mode="wait">
                  {inCart ? (
                    <motion.div
                      key="controls"
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="flex items-center gap-1"
                    >
                      <button
                        className="p-1 rounded-full hover:bg-primary-foreground/20 active:scale-90 transition-all"
                        onClick={() => onDecrement(item)}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="text-sm font-bold tabular-nums min-w-[1.5rem] text-center">
                        {quantity}
                      </span>
                      <button
                        className="p-1 rounded-full hover:bg-primary-foreground/20 active:scale-90 transition-all"
                        onClick={() => onIncrement(item)}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                      <span className="text-xs font-medium max-w-[80px] truncate ml-1 opacity-80">
                        {item.name}
                      </span>
                    </motion.div>
                  ) : (
                    <motion.button
                      key="add"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-1.5 active:scale-95 transition-transform"
                      onClick={() => onAdd(item)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span className="text-xs font-medium max-w-[100px] truncate">
                        {item.name}
                      </span>
                    </motion.button>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" className="h-1.5" />
      </ScrollArea>
    </div>
  );
}
