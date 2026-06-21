import { Button } from '@/components/ui/button';
import { Star, Plus, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { ItemImage } from './ItemImage';
import { describePackaging, describeQuantity, quickAddSteps } from '@features/inventory/utils/packaging';

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
  const [quantity, setQuantity] = useState(0);

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

  const pkg = {
    unit: item.unit,
    pack_label: item.pack_label,
    pack_size: item.pack_size,
    case_label: item.case_label,
    case_size: item.case_size,
  };
  const packagingText = describePackaging(pkg);
  const packSteps = quickAddSteps(pkg).filter((s) => s.singles > 1);

  return (
    <div className="h-full flex flex-col">
      {/* Item Image (photo or category placeholder) */}
      <ItemImage
        photoUrl={item.photo_url}
        name={item.name}
        categoryName={item.inventory_categories?.name}
        alt={item.name}
        className="aspect-square w-full mb-4"
      />

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
        {packagingText && (
          <p className="text-xs text-muted-foreground mt-2">{packagingText}</p>
        )}
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

        {packSteps.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 min-w-[72px]"
              onClick={() => setQuantity((q) => q + 1)}
            >
              +1 {item.unit || 'unit'}
            </Button>
            {packSteps.map((s) => (
              <Button
                key={s.label}
                type="button"
                variant="outline"
                size="sm"
                className="flex-1 min-w-[72px]"
                onClick={() => setQuantity((q) => q + s.singles)}
              >
                +{s.label}
              </Button>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <div className="flex items-center border rounded-md">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-2"
              onClick={() => setQuantity(Math.max(0, quantity - 1))}
              aria-label={`Decrease ${item.name}`}
            >
              -
            </Button>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-12 text-center border-0 bg-transparent text-sm focus:outline-none"
              min="0"
              aria-label={`Quantity of ${item.name}`}
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-2"
              onClick={() => setQuantity(quantity + 1)}
              aria-label={`Increase ${item.name}`}
            >
              +
            </Button>
          </div>
          <Button
            className="flex-1"
            onClick={() => onAddToCart(quantity)}
            disabled={isOutOfStock || quantity < 1}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add to Cart
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          {quantity > 0 ? `Ordering ${describeQuantity(quantity, pkg)}` : 'Tap a quantity, pack, or case'}
          {cartQuantity > 0 && ` · ${cartQuantity} in cart`}
        </p>
      </div>
    </div>
  );
}
