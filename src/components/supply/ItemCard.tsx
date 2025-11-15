import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ItemCardProps {
  id: string;
  name: string;
  sku?: string;
  description?: string;
  quantity?: number;
  unit?: string;
  category?: string;
  cartQuantity?: number;
  onAdd: () => void;
  onIncrement?: () => void;
  onDecrement?: () => void;
}

export function ItemCard({
  id,
  name,
  sku,
  description,
  quantity = 0,
  unit = 'units',
  category,
  cartQuantity = 0,
  onAdd,
  onIncrement,
  onDecrement,
}: ItemCardProps) {
  const inStock = quantity > 0;
  const lowStock = quantity > 0 && quantity <= 10;

  return (
    <div 
      className={cn(
        "group relative border rounded-lg p-4 transition-all hover:shadow-md hover:border-primary/30",
        !inStock && "opacity-60",
        cartQuantity > 0 && "border-primary/50 bg-primary/5"
      )}
    >
      {/* Stock indicator */}
      {lowStock && (
        <Badge 
          variant="outline" 
          className="absolute top-2 right-2 bg-warning/10 text-warning-foreground border-warning/30 text-xs"
        >
          Low Stock
        </Badge>
      )}

      <div className="flex flex-col gap-3">
        {/* Item info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-1">
            <Package className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm line-clamp-2">{name}</h3>
              {sku && (
                <Badge variant="outline" className="mt-1 font-mono text-xs">
                  {sku}
                </Badge>
              )}
            </div>
          </div>

          {description && (
            <p className="text-xs text-muted-foreground line-clamp-2 ml-7">
              {description}
            </p>
          )}

          <div className="flex items-center gap-2 mt-2 ml-7 text-xs">
            {category && (
              <Badge variant="outline" className="text-xs">
                {category}
              </Badge>
            )}
            <span className={cn(
              "font-medium",
              inStock ? "text-success" : "text-destructive"
            )}>
              {inStock ? `${quantity} ${unit}` : 'Out of stock'}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-2">
          {cartQuantity === 0 ? (
            <Button
              size="sm"
              className="w-full touch-manipulation"
              onClick={onAdd}
              disabled={!inStock}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add to Cart
            </Button>
          ) : (
            <div className="flex items-center gap-2 w-full">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 touch-manipulation"
                onClick={onDecrement}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <div className="px-4 py-2 bg-primary/10 rounded-md text-sm font-semibold min-w-[60px] text-center">
                {cartQuantity}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 touch-manipulation"
                onClick={onIncrement}
                disabled={cartQuantity >= quantity}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
