import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, X, Send, ChevronRight, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CartItem } from '@/hooks/useOrderCart';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface OrderCartProps {
  items: CartItem[];
  totalItems: number;
  onRemove: (itemId: string) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onSubmit: (options?: Record<string, unknown>) => Promise<unknown>;
  onClear: () => void;
  isSubmitting: boolean;
}

export function OrderCart({
  items,
  totalItems,
  onRemove,
  onUpdateQuantity,
  onSubmit,
  onClear,
  isSubmitting,
}: OrderCartProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleItemName = (itemId: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };
  const [options, setOptions] = useState({
    title: '',
    justification: 'Standard supply request',
    priority: 'medium',
    delivery_location: '',
  });

  const handleSubmit = async () => {
    await onSubmit(options);
    setIsOpen(false);
    setShowOptions(false);
    setOptions({
      title: '',
      justification: 'Standard supply request',
      priority: 'medium',
      delivery_location: '',
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          className="fixed bottom-28 right-3 h-10 px-3 rounded-full shadow-md z-50 touch-manipulation pb-safe text-sm"
          size="sm"
        >
          <ShoppingCart className="h-4 w-4 mr-1.5" />
          <span className="text-xs">{totalItems}</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col pb-20 sm:pb-6">
        <SheetHeader>
          <SheetTitle>Your Order</SheetTitle>
          <SheetDescription>
            {items.length === 0 
              ? 'Your cart is empty'
              : `${items.length} item${items.length !== 1 ? 's' : ''} • ${totalItems} total`
            }
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-2 space-y-2">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <ShoppingCart className="h-10 w-10 text-muted-foreground opacity-50 mb-2" />
              <p className="text-muted-foreground">
                Add items from the catalog to get started
              </p>
            </div>
          ) : (
            items.map(item => (
              <div 
                key={item.item_id}
                className="flex flex-col gap-1 p-2 border rounded-lg"
              >
                {/* Row 1: Name + Remove */}
                <div className="flex items-start justify-between gap-2">
                  <div
                    className="flex-1 min-w-0 overflow-hidden cursor-pointer"
                    onClick={() => toggleItemName(item.item_id)}
                  >
                    <div className={cn(
                      "font-medium text-sm leading-tight",
                      expandedItems.has(item.item_id) ? "break-words" : "truncate"
                    )}>
                      {item.item_name}
                    </div>
                    {item.item_sku && (
                      <span className="text-[11px] font-mono text-muted-foreground mt-0.5 block">
                        {item.item_sku}
                      </span>
                    )}
                  </div>
                  <button
                    className="p-1.5 -m-1 rounded-full text-muted-foreground hover:text-destructive active:scale-90 transition-all touch-manipulation"
                    onClick={() => onRemove(item.item_id)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {/* Row 2: Quantity stepper */}
                <div className="flex items-center justify-between bg-muted/50 rounded-lg px-2 py-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full touch-manipulation active:scale-95"
                    onClick={() => {
                      if (item.quantity <= 1) onRemove(item.item_id);
                      else onUpdateQuantity(item.item_id, item.quantity - 1);
                    }}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-sm tabular-nums min-w-[1.5ch] text-center">
                      {item.quantity}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {item.item_unit || 'units'}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full touch-manipulation active:scale-95"
                    onClick={() => onUpdateQuantity(item.item_id, item.quantity + 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t pt-4 space-y-3">
            {!showOptions ? (
              <div className="space-y-2">
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowOptions(true);
                  }}
                  variant="outline"
                  className="w-full h-9 text-sm"
                  size="sm"
                >
                  Add Details (Optional)
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSubmit();
                  }}
                  disabled={isSubmitting}
                  className="w-full h-9 text-sm"
                  size="sm"
                >
                  <Send className="h-3 w-3 mr-1.5" />
                  {isSubmitting ? 'Submitting...' : 'Submit Order'}
                </Button>
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onClear();
                  }}
                  variant="ghost"
                  className="w-full h-9 text-sm"
                  size="sm"
                >
                  Clear Cart
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="title" className="text-xs">
                    Custom Title (Optional)
                  </Label>
                  <Input
                    id="title"
                    placeholder="Auto-generated from items"
                    value={options.title}
                    onChange={(e) => setOptions(prev => ({ ...prev, title: e.target.value }))}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="justification" className="text-xs">
                    Justification
                  </Label>
                  <Select 
                    value={options.justification}
                    onValueChange={(value) => setOptions(prev => ({ ...prev, justification: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Standard supply request">Restocking</SelectItem>
                      <SelectItem value="New employee setup">New Employee</SelectItem>
                      <SelectItem value="Special project">Special Project</SelectItem>
                      <SelectItem value="Replacement">Replacement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority" className="text-xs">
                    Priority
                  </Label>
                  <Select 
                    value={options.priority}
                    onValueChange={(value) => setOptions(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger className="mt-1">
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

                <div>
                  <Label htmlFor="location" className="text-xs">
                    Delivery Location (Optional)
                  </Label>
                  <Input
                    id="location"
                    placeholder="e.g., Room 205"
                    value={options.delivery_location}
                    onChange={(e) => setOptions(prev => ({ ...prev, delivery_location: e.target.value }))}
                    className="mt-1"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowOptions(false);
                    }}
                    variant="outline"
                    className="flex-1 h-9 text-sm"
                    size="sm"
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSubmit();
                    }}
                    disabled={isSubmitting}
                    className="flex-1 h-9 text-sm"
                    size="sm"
                  >
                    <Send className="h-3 w-3 mr-1.5" />
                    {isSubmitting ? 'Submitting...' : 'Submit'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
