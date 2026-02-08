import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Minus, Plus, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InlineItemRowProps {
  item: {
    id: string;
    name: string;
    sku?: string;
    unit?: string;
    quantity?: number;
    categoryName?: string;
    requires_justification?: boolean;
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

  return (
    <div
      className={cn(
        "rounded-xl border transition-all overflow-hidden",
        "flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:gap-3",
        inCart 
          ? "bg-primary/5 border-primary/20" 
          : "bg-card hover:bg-accent/50",
        item.requires_justification && "border-l-4 border-l-amber-500",
        compact && "p-2"
      )}
    >
      {/* Mobile: Row 1 — Name + Star (top-right) */}
      <div className="flex items-start gap-2 sm:flex-1 sm:min-w-0 sm:items-center">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={cn(
              "font-medium truncate",
              compact ? "text-sm" : "text-[15px] sm:text-base"
            )}>
              {item.name}
            </span>
            {item.requires_justification && (
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
            )}
          </div>
          {/* Mobile: metadata under name */}
          <div className="flex items-center gap-2 mt-0.5 sm:hidden">
            {item.sku && (
              <span className="font-mono text-[11px] text-muted-foreground">
                {item.sku}
              </span>
            )}
            <span className="text-[11px] text-muted-foreground">
              {item.quantity ?? 0} {item.unit || 'units'} in stock
            </span>
          </div>
        </div>

        {/* Mobile: Star button — always visible top-right */}
        {onToggleFavorite && (
          <button
            className="shrink-0 p-2 -m-1 rounded-full active:scale-90 transition-transform touch-manipulation sm:hidden"
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

      {/* Mobile: Row 2 — Quantity controls (full width) */}
      <div className="sm:hidden">
        {inCart ? (
          <div className="flex items-center justify-between bg-muted/50 rounded-lg px-2 py-1">
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
            <span className="font-bold text-lg tabular-nums">
              {cartQuantity}
            </span>
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
            variant="secondary"
            className="w-full h-11 touch-manipulation active:scale-[0.98] transition-transform text-sm font-medium"
            onClick={(e) => {
              e.stopPropagation();
              onAdd();
            }}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add to Cart
          </Button>
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
    </div>
  );
}
