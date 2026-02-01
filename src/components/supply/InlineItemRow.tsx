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
        "rounded-lg border transition-all overflow-hidden",
        // Mobile: stacked layout, Desktop: single row
        "flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:gap-3",
        inCart 
          ? "bg-primary/5 border-primary/20" 
          : "bg-card hover:bg-accent/50",
        item.requires_justification && "border-l-4 border-l-amber-500",
        compact && "p-2"
      )}
    >
      {/* Mobile Row 1 / Desktop: Item Info */}
      <div className="flex items-center justify-between gap-2 sm:flex-1 sm:min-w-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* SKU - hidden on mobile, shown on desktop */}
          {item.sku && (
            <Badge variant="outline" className="font-mono text-xs shrink-0 hidden sm:inline-flex">
              {item.sku}
            </Badge>
          )}
          <span className={cn(
            "font-medium truncate",
            compact ? "text-sm" : "text-sm sm:text-base"
          )}>
            {item.name}
          </span>
          {item.requires_justification && (
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          )}
        </div>
        
        {/* Favorite button - shown inline on mobile */}
        {onToggleFavorite && (
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-10 w-10 sm:hidden touch-manipulation"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
          >
            <Star
              className={cn(
                "h-5 w-5",
                isFavorite ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
              )}
            />
          </Button>
        )}
        
        {/* Desktop: metadata below name */}
        {!compact && (
          <div className="hidden sm:flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground">
              Stock: {item.quantity ?? 0} {item.unit || 'units'}
            </span>
            {item.categoryName && (
              <Badge variant="secondary" className="text-xs">
                {item.categoryName}
              </Badge>
            )}
            {item.requires_justification && (
              <Badge variant="outline" className="text-xs text-amber-600 border-amber-500/30">
                Requires approval
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Mobile Row 2: Stock + Controls */}
      <div className="flex items-center justify-between gap-2 sm:contents">
        {/* Mobile: Stock info on left */}
        <div className="flex items-center gap-2 min-w-0 sm:hidden">
          {item.sku && (
            <Badge variant="outline" className="font-mono text-xs shrink-0">
              {item.sku}
            </Badge>
          )}
          <span className="text-xs text-muted-foreground shrink-0">
            Stock: {item.quantity ?? 0}
          </span>
        </div>

        {/* Desktop: Favorite button */}
        {onToggleFavorite && (
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-8 w-8 hidden sm:inline-flex"
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

        {/* Quantity Controls - ALWAYS visible and never cut off */}
        <div className="flex items-center gap-1 shrink-0">
          {inCart ? (
            <>
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 sm:h-9 sm:w-9 rounded-full touch-manipulation"
                onClick={(e) => {
                  e.stopPropagation();
                  onDecrement();
                }}
              >
                <Minus className="h-5 w-5 sm:h-4 sm:w-4" />
              </Button>
              <span className="w-10 sm:w-8 text-center font-semibold text-lg">
                {cartQuantity}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 sm:h-9 sm:w-9 rounded-full touch-manipulation"
                onClick={(e) => {
                  e.stopPropagation();
                  onIncrement();
                }}
              >
                <Plus className="h-5 w-5 sm:h-4 sm:w-4" />
              </Button>
            </>
          ) : (
            <Button
              variant="secondary"
              className="h-11 px-6 sm:h-9 sm:px-4 touch-manipulation"
              onClick={(e) => {
                e.stopPropagation();
                onAdd();
              }}
            >
              <Plus className="h-5 w-5 sm:h-4 sm:w-4 mr-1" />
              Add
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
