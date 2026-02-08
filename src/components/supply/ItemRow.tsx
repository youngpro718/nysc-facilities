import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react';

interface ItemRowProps {
  item: Record<string, unknown>;
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
  const stockLevel = item.quantity || 0;
  const isLowStock = stockLevel > 0 && stockLevel <= 10;
  const isOutOfStock = stockLevel === 0;

  return (
    <div
      onClick={onSelect}
      className={`flex items-center gap-3 px-4 py-3 border-b hover:bg-muted/50 cursor-pointer transition-colors ${
        isSelected ? 'bg-muted/70' : ''
      }`}
    >
      {/* Stock indicator dot */}
      <div
        className={`w-2 h-2 rounded-full flex-shrink-0 ${
          isOutOfStock
            ? 'bg-destructive'
            : isLowStock
            ? 'bg-warning'
            : 'bg-success'
        }`}
      />

      {/* Item info */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{item.name}</div>
        <div className="text-xs text-muted-foreground">
          {item.sku} • {stockLevel} {item.unit || 'units'}
        </div>
      </div>

      {/* Quick action */}
      {cartQuantity > 0 ? (
        <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            onClick={onDecrement}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="w-8 text-center text-sm font-medium">{cartQuantity}</span>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            onClick={onIncrement}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          variant="default"
          className="flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart();
          }}
          disabled={isOutOfStock}
        >
          {isOutOfStock ? 'Out' : 'Add'}
        </Button>
      )}
    </div>
  );
}
