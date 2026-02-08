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
        "flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:gap-3",
        inCart 
          ? "bg-primary/5 border-primary/20" 
          : "bg-card hover:bg-accent/50",
        item.requires_justification && "border-l-4 border-l-amber-500",
        compact && "p-2"
      )}
    >
      {/* Mobile Row 1: Item Name + Warning Icon */}
      <div className="flex items-center gap-2 sm:flex-1 sm:min-w-0">
        <span className={cn(
          "font-medium truncate flex-1",
          compact ? "text-sm" : "text-sm sm:text-base"
        )}>
          {item.name}
        </span>
        {item.requires_justification && (
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 sm:hidden" />
        )}
        
        {/* Desktop: Show all metadata inline */}
        <div className="hidden sm:flex items-center gap-2">
          {item.sku && (
            <Badge variant="outline" className="font-mono text-xs shrink-0">
              {item.sku}
            </Badge>
          )}
          {item.requires_justification && (
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
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

      {/* Mobile Row 2: SKU + Stock + Favorite Star */}
      <div className="flex items-center justify-between sm:hidden">
        <div className="flex items-center gap-2 min-w-0">
          {item.sku && (
            <Badge variant="outline" className="font-mono text-xs shrink-0">
              {item.sku}
            </Badge>
          )}
          <span className="text-xs text-muted-foreground shrink-0">
            Stock: {item.quantity ?? 0}
          </span>
        </div>
        {onToggleFavorite && (
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-10 w-10 touch-manipulation"
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
      </div>

      {/* Mobile Row 3: Quantity Controls (centered, full width) */}
      <div className="flex justify-center pt-1 sm:hidden">
        {inCart ? (
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full touch-manipulation"
              onClick={(e) => {
                e.stopPropagation();
                onDecrement();
              }}
            >
              <Minus className="h-5 w-5" />
            </Button>
            <span className="w-12 text-center font-bold text-xl">
              {cartQuantity}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full touch-manipulation"
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
            className="h-12 px-8 touch-manipulation"
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
