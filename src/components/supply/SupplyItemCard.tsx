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

interface SupplyItemCardProps {
  item: {
    id: string;
    name: string;
    sku?: string;
    unit?: string;
    quantity?: number;
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

  const stockStatus = (item.quantity ?? 0) > 10 
    ? 'in-stock' 
    : (item.quantity ?? 0) > 0 
      ? 'low-stock' 
      : 'out-of-stock';

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
          "group relative rounded-2xl border overflow-hidden transition-all",
          "bg-card hover:shadow-md",
          inCart && "ring-2 ring-primary/30 bg-primary/5",
          item.requires_justification && "border-l-4 border-l-amber-500"
        )}
      >
        {/* Thumbnail / Visual */}
        <div 
          className="relative h-24 bg-gradient-to-br from-muted to-muted/50 cursor-pointer"
          onClick={() => setDetailOpen(true)}
        >
          {item.photo_url ? (
            <img
              src={item.photo_url}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-10 w-10 text-muted-foreground/20" />
            </div>
          )}
          
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
                "active:scale-90"
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

          {/* Stock indicator */}
          <div className="absolute bottom-2 left-2">
            <Badge
              variant="secondary"
              className={cn(
                "text-[10px] font-medium backdrop-blur-sm",
                stockStatus === 'in-stock' && "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400",
                stockStatus === 'low-stock' && "bg-amber-500/20 text-amber-700 dark:text-amber-400",
                stockStatus === 'out-of-stock' && "bg-red-500/20 text-red-700 dark:text-red-400"
              )}
            >
              {item.quantity ?? 0} {item.unit || 'in stock'}
            </Badge>
          </div>

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
          {/* Name and SKU */}
          <div className="min-w-0">
            <h3 
              className="font-medium text-sm leading-tight line-clamp-2 cursor-pointer hover:text-primary"
              onClick={() => setDetailOpen(true)}
            >
              {item.name}
            </h3>
            {item.sku && (
              <span className="text-[10px] font-mono text-muted-foreground">
                {item.sku}
              </span>
            )}
          </div>

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
                  className="flex items-center justify-between bg-muted/50 rounded-xl px-1 py-0.5"
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
                      "w-full h-9 rounded-xl font-medium transition-all",
                      justAdded && "bg-emerald-500 text-white"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAdd();
                    }}
                    disabled={stockStatus === 'out-of-stock'}
                  >
                    {justAdded ? (
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
              {item.photo_url ? (
                <div className="w-full rounded-2xl overflow-hidden bg-muted aspect-[16/9]">
                  <img
                    src={item.photo_url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-full rounded-2xl bg-gradient-to-br from-muted to-muted/50 aspect-[16/9] flex flex-col items-center justify-center gap-2">
                  <Package className="h-16 w-16 text-muted-foreground/20" />
                  <span className="text-sm text-muted-foreground/40">No image available</span>
                </div>
              )}
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
                      "active:scale-90",
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
                {item.sku && (
                  <Badge variant="outline" className="font-mono text-xs">
                    {item.sku}
                  </Badge>
                )}
                {item.categoryName && (
                  <Badge variant="secondary" className="text-xs">
                    {item.categoryName}
                  </Badge>
                )}
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    stockStatus === 'in-stock' && "text-emerald-600 border-emerald-500/30",
                    stockStatus === 'low-stock' && "text-amber-600 border-amber-500/30",
                    stockStatus === 'out-of-stock' && "text-red-600 border-red-500/30"
                  )}
                >
                  {item.quantity ?? 0} {item.unit || 'units'} available
                </Badge>
                {item.requires_justification && (
                  <Badge variant="outline" className="text-xs text-amber-600 border-amber-500/30 gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Requires approval
                  </Badge>
                )}
              </div>

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
                <div className="flex items-center justify-between bg-muted rounded-2xl px-4 py-3">
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
                  className="w-full h-14 rounded-2xl text-base font-semibold"
                  onClick={handleAdd}
                  disabled={stockStatus === 'out-of-stock'}
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add to Order
                </Button>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
