import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetFooter 
} from '@/components/ui/sheet';
import { ShoppingCart, Send, Trash2, X, ChevronUp, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CartItem } from '@/hooks/useOrderCart';

interface OrderSummaryFooterProps {
  items: CartItem[];
  totalItems: number;
  onRemove: (itemId: string) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onSubmit: (options?: any) => Promise<any>;
  onClear: () => void;
  isSubmitting: boolean;
}

export function OrderSummaryFooter({
  items,
  totalItems,
  onRemove,
  onUpdateQuantity,
  onSubmit,
  onClear,
  isSubmitting,
}: OrderSummaryFooterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [priority, setPriority] = useState('medium');

  const handleSubmit = async () => {
    await onSubmit({
      priority,
      delivery_location: deliveryLocation,
      justification: 'Standard supply request',
    });
    setIsOpen(false);
    setDeliveryLocation('');
    setPriority('medium');
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg pb-safe">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Summary */}
            <SheetTrigger asChild>
              <button className="flex items-center gap-3 flex-1 min-w-0 text-left">
                <div className="relative">
                  <ShoppingCart className="h-6 w-6" />
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                  >
                    {totalItems}
                  </Badge>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold">
                    {items.length} item{items.length !== 1 ? 's' : ''} in cart
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {items.slice(0, 2).map(i => i.item_name).join(', ')}
                    {items.length > 2 && `, +${items.length - 2} more`}
                  </p>
                </div>
                <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            </SheetTrigger>

            {/* Quick Submit */}
            <Button
              size="lg"
              className="shrink-0 gap-2"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">
                {isSubmitting ? 'Submitting...' : 'Submit Order'}
              </span>
              <span className="sm:hidden">
                {isSubmitting ? '...' : 'Submit'}
              </span>
            </Button>
          </div>
        </div>

        <SheetContent side="bottom" className="h-[85vh] flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Your Order ({totalItems} items)
            </SheetTitle>
          </SheetHeader>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto py-4 space-y-2">
            {items.map((item) => (
              <div
                key={item.item_id}
                className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.item_name}</p>
                  {item.item_sku && (
                    <Badge variant="outline" className="text-xs font-mono mt-1">
                      {item.item_sku}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => 
                      onUpdateQuantity(item.item_id, parseInt(e.target.value) || 1)
                    }
                    className="w-16 h-8 text-center"
                  />
                  <span className="text-xs text-muted-foreground w-10">
                    {item.item_unit || 'units'}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => onRemove(item.item_id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Order Options */}
          <div className="border-t pt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Delivery Location
                </Label>
                <Input
                  id="location"
                  placeholder="e.g., Room 205"
                  value={deliveryLocation}
                  onChange={(e) => setDeliveryLocation(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority" className="text-sm">Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <SheetFooter className="flex-row gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClear}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Submitting...' : 'Submit Order'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
