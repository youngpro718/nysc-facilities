import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Minus, Plus, AlertTriangle, Package, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';

interface InlineItemRowProps {
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
  compact?: boolean;
}

export function InlineItemRow({
  item,
  cartQuantity,
  isFavorite,
  onAdd,
  onIncrement,
  onDecrement,
  onToggleFavorite,
  compact = false,
}: InlineItemRowProps) {
  const inCart = cartQuantity > 0;
  const [nameExpanded, setNameExpanded] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  return (
    <div
      className={cn(
        "rounded-xl border transition-all",
        "flex flex-col gap-1.5 p-2.5 sm:flex-row sm:items-center sm:gap-3 sm:p-3",
        inCart
          ? "bg-primary/5 border-primary/20"
          : "bg-card hover:bg-accent/50",
        item.requires_justification && "border-l-4 border-l-amber-500",
        compact && "p-2"
      )}
    >
      {/* Mobile: Row 1 — Name + Star (top-right) */}
      <div className="flex items-start gap-2 sm:flex-1 sm:min-w-0 sm:items-center overflow-hidden">
        <div className="flex-1 min-w-0 overflow-hidden">
          <div
            className="flex items-center gap-1.5 cursor-pointer sm:cursor-default"
            onClick={() => setDetailOpen(true)}
          >
            <span className={cn(
              "font-medium",
              compact ? "text-sm" : "text-sm sm:text-base",
              nameExpanded ? "whitespace-normal break-words" : "truncate block"
            )}>
              {item.name}
            </span>
            {item.requires_justification && (
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            )}
          </div>
          {/* Mobile: metadata under name */}
          <div className="flex items-center gap-1.5 sm:hidden">
            {item.sku && (
              <span className="font-mono text-[10px] text-muted-foreground">
                {item.sku}
              </span>
            )}
            <span className="text-[10px] text-muted-foreground">
              {item.quantity ?? 0} {item.unit || 'units'} avail
            </span>
          </div>
        </div>

        {/* Desktop: Show all metadata inline */}
        <div className="hidden sm:flex items-center gap-2">
          {item.sku && (
            <Badge variant="outline" className="font-mono text-xs shrink-0">
              {item.sku}
            </Badge>
          )}
        </div>
      </div>

      {/* Desktop: Additional metadata */}
      {!compact && (
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground">
            Stock: {item.quantity ?? 0} {item.unit || 'units'}
          </span>
          {item.categoryName && (
            <Badge variant="secondary" className="text-xs">
              {item.categoryName}
            </Badge>
          )}
          {item.requires_justification && (
            <Badge variant="outline" className="text-xs text-amber-600 dark:text-amber-400 border-amber-500/30">
              Requires approval
            </Badge>
          )}
        </div>
      )}

      {/* Mobile: Row 2 — Quantity controls + Star */}
      <div className="flex items-center gap-1.5 sm:hidden">
        {inCart ? (
          <div className="flex items-center bg-muted/50 rounded-lg px-1 py-0.5 gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full touch-manipulation active:scale-95"
              onClick={(e) => {
                e.stopPropagation();
                onDecrement();
              }}
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <span className="font-bold text-sm tabular-nums w-6 text-center">
              {cartQuantity}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full touch-manipulation active:scale-95"
              onClick={(e) => {
                e.stopPropagation();
                onIncrement();
              }}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            className="h-7 px-2.5 shrink-0 touch-manipulation active:scale-[0.98] transition-transform text-xs font-medium rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              onAdd();
            }}
          >
            <Plus className="h-3 w-3 mr-0.5" />
            Add
          </Button>
        )}
        {onToggleFavorite && (
          <button
            className="shrink-0 h-7 w-7 flex items-center justify-center rounded-full border bg-card active:scale-90 transition-transform touch-manipulation"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
          >
            <Star
              className={cn(
                "h-3.5 w-3.5",
                isFavorite ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40"
              )}
            />
          </button>
        )}
      </div>

      {/* Desktop: Favorite + Controls inline */}
      <div className="hidden sm:flex items-center gap-2 shrink-0">
        {onToggleFavorite && (
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
          >
            <Star
              className={cn(
                "h-4 w-4",
                isFavorite ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
              )}
            />
          </Button>
        )}

        {inCart ? (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                onDecrement();
              }}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-8 text-center font-semibold">
              {cartQuantity}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                onIncrement();
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            variant="secondary"
            className="h-9 px-4"
            onClick={(e) => {
              e.stopPropagation();
              onAdd();
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        )}
      </div>

      {/* Item Detail Sheet */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl px-0 pb-safe max-h-[80vh]">
          <div className="flex flex-col">
            {/* Close handle */}
            <div className="flex justify-center pt-2 pb-3">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
            </div>

            {/* Image */}
            <div className="px-5">
              {item.photo_url ? (
                <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-muted">
                  <img
                    src={item.photo_url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-full aspect-[4/3] rounded-2xl bg-muted/50 flex flex-col items-center justify-center gap-2">
                  <Package className="h-12 w-12 text-muted-foreground/30" />
                  <span className="text-xs text-muted-foreground/50">No image</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="px-5 pt-4 pb-2 space-y-3">
              {/* Name + Favorite */}
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-semibold leading-snug flex-1">
                  {item.name}
                </h3>
                {onToggleFavorite && (
                  <button
                    className="shrink-0 h-10 w-10 flex items-center justify-center rounded-full border bg-card active:scale-90 transition-transform touch-manipulation"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite();
                    }}
                  >
                    <Star
                      className={cn(
                        "h-5 w-5",
                        isFavorite ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40"
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
                    (item.quantity ?? 0) > 0
                      ? "text-green-600 border-green-500/30"
                      : "text-red-600 border-red-500/30"
                  )}
                >
                  {item.quantity ?? 0} {item.unit || 'units'} in stock
                </Badge>
                {item.requires_justification && (
                  <Badge variant="outline" className="text-xs text-amber-600 border-amber-500/30">
                    <AlertTriangle className="h-3 w-3 mr-1" />
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
            <div className="px-5 pt-2 pb-4">
              {inCart ? (
                <div className="flex items-center justify-between bg-muted/50 rounded-xl px-3 py-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 rounded-full touch-manipulation active:scale-95"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDecrement();
                    }}
                  >
                    <Minus className="h-5 w-5" />
                  </Button>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xl tabular-nums">
                      {cartQuantity}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {item.unit || 'units'}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 rounded-full touch-manipulation active:scale-95"
                    onClick={(e) => {
                      e.stopPropagation();
                      onIncrement();
                    }}
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
              ) : (
                <Button
                  className="w-full h-12 rounded-xl text-base font-semibold touch-manipulation active:scale-[0.98]"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAdd();
                  }}
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add to Cart
                </Button>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
