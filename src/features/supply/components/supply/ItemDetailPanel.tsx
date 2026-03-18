import { Button } from '@/components/ui/button';
import { Star, Plus, Package, MapPin, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

interface ItemDetailPanelProps {
  item: any;
  cartQuantity: number;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onAddToCart: (quantity: number) => void;
}

export function ItemDetailPanel({
  item,
  cartQuantity,
  isFavorite,
  onToggleFavorite,
  onAddToCart,
}: ItemDetailPanelProps) {
  const [quantity, setQuantity] = useState(1);

  if (!item) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Select an item to view details</p>
        </div>
      </div>
    );
  }

  const stockLevel = item.quantity || 0;
  const isLowStock = stockLevel > 0 && stockLevel <= 10;
  const isOutOfStock = stockLevel === 0;

  return (
    <div className="h-full flex flex-col">
      {/* Item Image Placeholder */}
      <div className="aspect-square bg-muted rounded-lg mb-4 flex items-center justify-center">
        <Package className="h-16 w-16 text-muted-foreground opacity-20" />
      </div>

      {/* Item Name & Category */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-1">{item.name}</h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>SKU: {item.sku}</span>
          {item.inventory_categories && (
            <>
              <span>•</span>
              <Badge variant="outline" className="text-xs">
                {item.inventory_categories.name}
              </Badge>
            </>
          )}
        </div>
      </div>

      {/* Stock Status */}
      <div className="mb-4 p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Stock Level</span>
          <span className="text-sm font-semibold">
            {stockLevel} {item.unit || 'units'}
          </span>
        </div>
        <div className="w-full bg-background rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              isOutOfStock
                ? 'bg-destructive'
                : isLowStock
                ? 'bg-warning'
                : 'bg-success'
            }`}
            style={{ width: `${Math.min((stockLevel / 50) * 100, 100)}%` }}
          />
        </div>
        {isLowStock && !isOutOfStock && (
          <p className="text-xs text-warning mt-1">Low stock - order soon</p>
        )}
        {isOutOfStock && (
          <p className="text-xs text-destructive mt-1">Out of stock</p>
        )}
      </div>

      {/* Description */}
      {item.description && (
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-1">Description</h4>
          <p className="text-sm text-muted-foreground">{item.description}</p>
        </div>
      )}

      {/* Additional Info */}
      <div className="space-y-2 mb-4 text-sm">
        {item.location && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>Location: {item.location}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Typical lead time: 3-5 days</span>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions */}
      <div className="space-y-2 pt-4 border-t">
        <Button
          variant="outline"
          className="w-full"
          onClick={onToggleFavorite}
        >
          <Star className={`h-4 w-4 mr-2 ${isFavorite ? 'fill-current' : ''}`} />
          {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
        </Button>

        <div className="flex gap-2">
          <div className="flex items-center border rounded-md">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-2"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
            >
              -
            </Button>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-12 text-center border-0 bg-transparent text-sm focus:outline-none"
              min="1"
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-2"
              onClick={() => setQuantity(quantity + 1)}
            >
              +
            </Button>
          </div>
          <Button
            className="flex-1"
            onClick={() => onAddToCart(quantity)}
            disabled={isOutOfStock}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add to Cart
          </Button>
        </div>

        {cartQuantity > 0 && (
          <p className="text-xs text-center text-muted-foreground">
            {cartQuantity} in cart
          </p>
        )}
      </div>
    </div>
  );
}
