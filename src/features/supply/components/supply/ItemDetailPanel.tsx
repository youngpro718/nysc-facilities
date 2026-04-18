import { Button } from '@/components/ui/button';
import { Star, Plus, Package } from 'lucide-react';
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
      {/* Item Image */}
      <div className="aspect-square bg-muted rounded-lg mb-4 flex items-center justify-center overflow-hidden">
        {item.photo_url ? (
          <img
            src={item.photo_url}
            alt={item.name}
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          <Package className="h-16 w-16 text-muted-foreground opacity-20" />
        )}
      </div>

      {/* Item Name & Category */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-1">{item.name}</h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {item.inventory_categories && (
            <Badge variant="outline" className="text-xs">
              {item.inventory_categories.name}
            </Badge>
          )}
          {isOutOfStock && (
            <Badge variant="destructive" className="text-xs">Unavailable</Badge>
          )}
        </div>
      </div>

      {/* Description */}
      {item.description && (
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-1">Description</h4>
          <p className="text-sm text-muted-foreground">{item.description}</p>
        </div>
      )}

      {/* Restricted item notice */}
      {item.requires_justification && (
        <div className="mb-4 p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 text-sm">
          <p className="font-medium text-amber-700 dark:text-amber-400">Requires supervisor review</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            This item must be reviewed by a supervisor before your request can be approved.
          </p>
        </div>
      )}

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
