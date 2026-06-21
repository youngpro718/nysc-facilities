/**
 * SupplyItemCard - Modern card-based item display
 * 
 * Features:
 * - Visual thumbnail with fallback
 * - Stock status indicator
 * - Smooth quantity controls
 * - Favorite toggle
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Minus, Plus, AlertTriangle, Package, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { motion, AnimatePresence } from 'framer-motion';
import { getGenericItemImage } from '@/utils/inventoryImages';

export type StockStatus = 'in_stock' | 'low' | 'out';

interface SupplyItemCardProps {
  item: {
    id: string;
    name: string;
    sku?: string;
    unit?: string;
    stockStatus?: StockStatus;
    categoryName?: string;
    requires_justification?: boolean;
    photo_url?: string | null;
    description?: string | null;
  };
  cartQuantity: number;
  isFavorite?: boolean;
  onAdd: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  onToggleFavorite?: () => void;
}

export function SupplyItemCard({
  item,
  cartQuantity,
  isFavorite,
  onAdd,
  onIncrement,
  onDecrement,
  onToggleFavorite,
}: SupplyItemCardProps) {
  const inCart = cartQuantity > 0;
  const [detailOpen, setDetailOpen] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const stockStatus: StockStatus = item.stockStatus ?? 'in_stock';
  const isOutOfStock = stockStatus === 'out';
  const isLowStock = stockStatus === 'low';

  const handleAdd = () => {
    onAdd();
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 600);
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          "group relative rounded-md border overflow-hidden transition-all",
          "bg-card",
          inCart && "ring-2 ring-primary/30 bg-primary/5"
        )}
      >
        {/* Thumbnail / Visual */}
        <div 
          className="relative h-24 bg-gradient-to-br from-muted to-muted/50 cursor-pointer"
          onClick={() => setDetailOpen(true)}
        >
          <img
            src={item.photo_url || getGenericItemImage(item.name)}
            alt={item.name}
            loading="lazy"
            className={cn(
              "w-full h-full object-cover transition-all",
              isOutOfStock && "grayscale opacity-50"
            )}
          />

          {/* Favorite button */}
          {onToggleFavorite && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
              className={cn(
                "absolute top-2 right-2 p-1.5 rounded-full transition-all",
                "bg-background/80 backdrop-blur-sm hover:bg-background",
                ""
              )}
            >
              <Star
                className={cn(
                  "h-4 w-4 transition-colors",
                  isFavorite 
                    ? "fill-yellow-400 text-yellow-400" 
                    : "text-muted-foreground/50"
                )}
              />
            </button>
          )}

          {/* Cart quantity badge */}
          <AnimatePresence>
            {inCart && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute top-2 left-2"
              >
                <Badge className="bg-primary text-primary-foreground font-bold">
                  {cartQuantity}
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Content */}
        <div className="p-3 space-y-2">
          {/* Name */}
          <div className="min-w-0">
            <h3 
              className="font-medium text-sm leading-tight line-clamp-2 cursor-pointer hover:text-primary"
              onClick={() => setDetailOpen(true)}
            >
              {item.name}
            </h3>
            {item.categoryName && (
              <span className="text-[10px] text-muted-foreground">
                {item.categoryName}
              </span>
            )}
          </div>

          {/* Stock status inline note (body, not corner badge) */}
          {isOutOfStock && (
            <div
              role="status"
              className="flex items-start gap-1.5 rounded-md border border-red-500/40 bg-red-500/10 px-2 py-1.5 text-[11px] font-medium text-red-700 dark:text-red-400"
            >
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span className="leading-tight">
                Out of stock — contact facilities to request a reorder
              </span>
            </div>
          )}
          {isLowStock && (
            <p className="text-[10px] text-muted-foreground italic">
              Limited stock
            </p>
          )}

          {/* Requires approval badge */}
          {item.requires_justification && (
            <Badge
              variant="outline"
              className="text-[10px] text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1"
            >
              <AlertTriangle className="h-3 w-3" />
              Needs approval
            </Badge>
          )}

          {/* Action Area */}
          <div className="pt-1">
            <AnimatePresence mode="wait">
              {inCart ? (
                <motion.div
                  key="controls"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-between bg-muted/50 rounded-md px-1 py-0.5"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDecrement();
                    }}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="font-bold text-sm tabular-nums">
                    {cartQuantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      onIncrement();
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="add"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Button
                    variant="secondary"
                    size="sm"
                    className={cn(
                      "w-full h-9 rounded-md font-medium transition-all",
                      justAdded && "bg-emerald-500 text-white",
                      isOutOfStock && "text-[11px] leading-tight whitespace-normal h-auto py-1.5"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAdd();
                    }}
                    disabled={isOutOfStock}
                    aria-label={
                      isOutOfStock
                        ? `${item.name} is out of stock — request a reorder from facilities`
                        : `Add ${item.name}`
                    }
                  >
                    {isOutOfStock ? (
                      'Out of stock — request reorder from facilities'
                    ) : justAdded ? (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Added!
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </>
                    )}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Item Detail Sheet */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl px-0 pb-safe max-h-[85dvh]">
          <div className="flex flex-col overflow-y-auto max-h-[calc(85dvh-1rem)]">
            {/* Close handle */}
            <div className="flex justify-center pt-2 pb-3 shrink-0">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
            </div>

            {/* Hero Image */}
            <div className="px-5 shrink-0">
              <div className="w-full rounded-md overflow-hidden bg-muted aspect-[16/9]">
                <img
                  src={item.photo_url || getGenericItemImage(item.name)}
                  alt={item.name}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Info */}
            <div className="px-5 pt-5 pb-2 space-y-4">
              {/* Name + Favorite */}
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-xl font-bold leading-tight flex-1">
                  {item.name}
                </h3>
                {onToggleFavorite && (
                  <button
                    className={cn(
                      "shrink-0 h-11 w-11 flex items-center justify-center rounded-full transition-all",
                      "",
                      isFavorite 
                        ? "bg-yellow-400/20" 
                        : "bg-muted hover:bg-muted-foreground/10"
                    )}
                    onClick={onToggleFavorite}
                  >
                    <Star
                      className={cn(
                        "h-5 w-5 transition-colors",
                        isFavorite 
                          ? "fill-yellow-400 text-yellow-400" 
                          : "text-muted-foreground"
                      )}
                    />
                  </button>
                )}
              </div>

              {/* Badges row */}
              <div className="flex flex-wrap items-center gap-2">
                {item.categoryName && (
                  <Badge variant="secondary" className="text-xs">
                    {item.categoryName}
                  </Badge>
                )}
                {isLowStock && (
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    Limited stock
                  </Badge>
                )}
                {item.requires_justification && (
                  <Badge variant="outline" className="text-xs text-amber-600 border-amber-500/30 gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Requires approval
                  </Badge>
                )}
              </div>

              {/* Prominent out-of-stock banner */}
              {isOutOfStock && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2.5 text-sm text-red-700 dark:text-red-400"
                >
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <div className="space-y-0.5">
                    <p className="font-semibold leading-tight">This item is out of stock.</p>
                    <p className="text-xs leading-snug">
                      Please contact facilities to request a reorder.
                    </p>
                  </div>
                </div>
              )}

              {/* Description */}
              {item.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              )}
            </div>

            {/* Action bar */}
            <div className="px-5 pt-4 pb-6">
              {inCart ? (
                <div className="flex items-center justify-between bg-muted rounded-md px-4 py-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-12 w-12 rounded-full"
                    onClick={onDecrement}
                  >
                    <Minus className="h-5 w-5" />
                  </Button>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-2xl tabular-nums">
                      {cartQuantity}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {item.unit || 'units'}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-12 w-12 rounded-full"
                    onClick={onIncrement}
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
              ) : (
                <Button
                  size="lg"
                  className={cn(
                    "w-full rounded-md font-semibold",
                    isOutOfStock ? "h-auto py-3 text-sm whitespace-normal leading-tight" : "h-14 text-base"
                  )}
                  onClick={handleAdd}
                  disabled={isOutOfStock}
                  aria-label={
                    isOutOfStock
                      ? `${item.name} is out of stock — request a reorder from facilities`
                      : `Add ${item.name} to order`
                  }
                >
                  {isOutOfStock ? (
                    'Out of stock — request reorder from facilities'
                  ) : (
                    <>
                      <Plus className="h-5 w-5 mr-2" />
                      Add to Order
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
