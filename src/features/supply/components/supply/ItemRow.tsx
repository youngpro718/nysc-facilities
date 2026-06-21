import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react';
import { ItemImage } from './ItemImage';

interface ItemRowProps {
  item: any;
  cartQuantity: number;
  isSelected: boolean;
  onSelect: () => void;
  onAddToCart: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
}

export function ItemRow({
  item,
  cartQuantity,
  isSelected,
  onSelect,
  onAddToCart,
  onIncrement,
  onDecrement,
}: ItemRowProps) {
  const stockStatus: 'in_stock' | 'low' | 'out' =
    (item.stockStatus as 'in_stock' | 'low' | 'out' | undefined) ??
    (item.stock_status as 'in_stock' | 'low' | 'out' | undefined) ??
    'in_stock';
  const isLowStock = stockStatus === 'low';
  const isOutOfStock = stockStatus === 'out';
  const unitLabel = item.unit || 'item';
  const packagingLabel = item.pack_size
    ? `${item.pack_size} ${unitLabel}${item.pack_size === 1 ? '' : 's'} per ${item.pack_label || 'pack'}`
    : unitLabel;

  return (
    <div
      onClick={onSelect}
      className={`flex items-center gap-3 px-4 py-3 border-b hover:bg-muted/50 cursor-pointer transition-colors ${
        isSelected ? 'bg-muted/70' : ''
      }`}
    >
      {/* Thumbnail (photo or category placeholder) */}
      <ItemImage
        photoUrl={item.photo_url}
        name={item.name}
        categoryName={item.inventory_categories?.name}
        alt={item.name}
        className="h-10 w-10 shrink-0"
      />

      {/* Item info */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate flex items-center gap-1.5">
          <span className="truncate">{item.name}</span>
          {item.requires_justification && (
            <span
              className="shrink-0 inline-flex items-center h-4 px-1.5 rounded-full text-[9px] font-semibold uppercase tracking-wide border border-amber-500/40 text-amber-700 dark:text-amber-400 bg-amber-500/10"
              title="Requires supervisor approval"
            >
              Approval
            </span>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          {[item.inventory_categories?.name, packagingLabel].filter(Boolean).join(' · ')}
        </div>
      </div>

      {/* Quick action */}
      {cartQuantity > 0 ? (
        <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="ghost"
            className="h-9 w-9 p-0 touch-manipulation"
            onClick={onDecrement}
            aria-label={`Decrease ${item.name}`}
          >
            <Minus className="h-3.5 w-3.5" />
          </Button>
          <span className="w-8 text-center text-sm font-medium">{cartQuantity}</span>
          <Button
            size="sm"
            variant="ghost"
            className="h-9 w-9 p-0 touch-manipulation"
            onClick={onIncrement}
            aria-label={`Increase ${item.name}`}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          variant="default"
          className="flex-shrink-0 min-h-[44px] touch-manipulation"
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart();
          }}
          disabled={isOutOfStock}
          aria-label={isOutOfStock ? `${item.name} is out of stock` : `Add ${item.name}`}
        >
          {isOutOfStock ? 'Out' : 'Add'}
        </Button>
      )}
    </div>
  );
}
