import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Minus, Plus, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InlineItemRowProps {
  item: {
    id: string;
    name: string;
    sku?: string;
    unit?: string;
    quantity?: number;
    categoryName?: string;
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
        "flex items-center gap-3 p-3 rounded-lg border transition-all",
        inCart 
          ? "bg-primary/5 border-primary/20" 
          : "bg-card hover:bg-accent/50",
        compact && "p-2"
      )}
    >
      {/* Item Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {item.sku && (
            <Badge variant="outline" className="font-mono text-xs shrink-0">
              {item.sku}
            </Badge>
          )}
          <span className={cn(
            "font-medium truncate",
            compact ? "text-sm" : "text-base"
          )}>
            {item.name}
          </span>
        </div>
        {!compact && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground">
              Stock: {item.quantity ?? 0} {item.unit || 'units'}
            </span>
            {item.categoryName && (
              <Badge variant="secondary" className="text-xs">
                {item.categoryName}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Favorite Button */}
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

      {/* Quantity Controls */}
      <div className="flex items-center gap-1 shrink-0">
        {inCart ? (
          <>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full touch-manipulation"
              onClick={(e) => {
                e.stopPropagation();
                onDecrement();
              }}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-8 text-center font-semibold text-lg">
              {cartQuantity}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full touch-manipulation"
              onClick={(e) => {
                e.stopPropagation();
                onIncrement();
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            className="h-9 px-4 touch-manipulation"
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
