import { Button } from '@/components/ui/button';
import { Star, Plus, Package, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { ItemImage } from './ItemImage';
import { describePackaging, describeQuantity, quickAddSteps, pluralize } from '@features/inventory/utils/packaging';

type StockStatus = 'in_stock' | 'low' | 'out';

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

  const stockStatus: StockStatus =
    (item.stockStatus as StockStatus | undefined) ??
    (item.stock_status as StockStatus | undefined) ??
    'in_stock';
  const isLowStock = stockStatus === 'low';
  const isOutOfStock = stockStatus === 'out';

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
      {/* Prominent out-of-stock banner */}
      {isOutOfStock && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2.5 text-sm text-red-700 dark:text-red-400"
        >
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <div className="space-y-0.5">
            <p className="font-semibold leading-tight">This item is out of stock.</p>
            <p className="text-xs leading-snug">
              Contact facilities to request a reorder.
            </p>
          </div>
        </div>
      )}

      {/* Item Image (photo or category placeholder) */}
      <ItemImage
        photoUrl={item.photo_url}
        name={item.name}
        categoryName={item.inventory_categories?.name}
        alt={item.name}
        className={`aspect-square w-full mb-4 ${isOutOfStock ? 'grayscale opacity-50' : ''}`}
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
          {isLowStock && (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              Limited stock
            </Badge>
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

      {/* Access-code threshold notice */}
      {typeof item.order_code_threshold === 'number' && item.order_code_threshold > 0 && (
        <div
          className={`mb-4 p-3 rounded-lg border text-sm ${
            quantity >= item.order_code_threshold
              ? 'border-primary/40 bg-primary/10'
              : 'border-primary/20 bg-primary/5'
          }`}
        >
          <p className="font-medium text-primary">
            {quantity >= item.order_code_threshold
              ? `Code required — ${quantity} ${quantity === 1 ? (item.unit || 'unit') : pluralize(item.unit || 'unit')} ≥ ${item.order_code_threshold}`
              : `Code required above ${item.order_code_threshold}`}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Orders at or above this quantity need your personal access code at checkout. Find your code on your Profile page.
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

        {isLowStock && (
          <p className="text-xs text-muted-foreground italic">
            Limited stock — orders may be partially fulfilled.
          </p>
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
            aria-label={
              isOutOfStock
                ? `${item.name} is out of stock — request a reorder from facilities`
                : `Add ${item.name} to cart`
            }
          >
            <Plus className="h-4 w-4 mr-2" />
            {isOutOfStock ? 'Out of stock' : 'Add to Cart'}
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
