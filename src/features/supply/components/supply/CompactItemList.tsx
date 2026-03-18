import { ItemRow } from './ItemRow';
import { Loader2 } from 'lucide-react';

interface CompactItemListProps {
  items: Record<string, any>[];
  cartItems: Record<string, any>[];
  selectedItemId: string | null;
  isLoading: boolean;
  onSelectItem: (itemId: string) => void;
  onAddItem: (item: any) => void;
  onIncrement: (item: any) => void;
  onDecrement: (item: any) => void;
}

export function CompactItemList({
  items,
  cartItems,
  selectedItemId,
  isLoading,
  onSelectItem,
  onAddItem,
  onIncrement,
  onDecrement,
}: CompactItemListProps) {
  const getCartQuantity = (itemId: string) => {
    const cartItem = cartItems.find(item => item.item_id === itemId);
    return cartItem?.quantity || 0;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-muted-foreground">
          <p className="text-sm">No items found</p>
          <p className="text-xs mt-1">Try adjusting your search or filters</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      <div className="max-h-[600px] overflow-y-auto">
        {items.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            cartQuantity={getCartQuantity(item.id)}
            isSelected={selectedItemId === item.id}
            onSelect={() => onSelectItem(item.id)}
            onAddToCart={() => onAddItem(item)}
            onIncrement={() => onIncrement(item)}
            onDecrement={() => onDecrement(item)}
          />
        ))}
      </div>
    </div>
  );
}
