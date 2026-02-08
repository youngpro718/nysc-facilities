import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetFooter 
} from '@/components/ui/sheet';
import { ShoppingCart, Send, Trash2, X, ChevronUp, MapPin, AlertTriangle, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoomAssignments } from '@/hooks/useUserRoomAssignments';
import type { CartItem } from '@/hooks/useOrderCart';

interface OrderSummaryFooterProps {
  items: CartItem[];
  totalItems: number;
  onRemove: (itemId: string) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onSubmit: (options?: Record<string, unknown>) => Promise<unknown>;
  onClear: () => void;
  isSubmitting: boolean;
  hasRestrictedItems?: boolean;
}

export function OrderSummaryFooter({
  items,
  totalItems,
  onRemove,
  onUpdateQuantity,
  onSubmit,
  onClear,
  isSubmitting,
  hasRestrictedItems = false,
}: OrderSummaryFooterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [priority, setPriority] = useState('medium');
  const [justification, setJustification] = useState('');
  const [isQuickSubmitting, setIsQuickSubmitting] = useState(false);
  const { profile, user } = useAuth();
  
  // Fetch user's room assignments for auto-fill
  const { data: roomAssignments } = useUserRoomAssignments(user?.id);

  // Pre-fill delivery location from room assignments or profile metadata
  useEffect(() => {
    if (deliveryLocation) return; // Don't override if already set
    
    // Try room assignments first (more accurate)
    const primaryRoom = roomAssignments?.find(a => a.is_primary);
    const firstRoom = roomAssignments?.[0];
    const roomFromAssignment = primaryRoom?.rooms?.room_number || firstRoom?.rooms?.room_number;
    
    if (roomFromAssignment) {
      setDeliveryLocation(roomFromAssignment);
      return;
    }
    
    // Fallback to profile metadata
    const meta = profile?.metadata as Record<string, unknown> | undefined;
    const roomFromProfile = meta?.room_number || meta?.office || '';
    if (roomFromProfile) {
      setDeliveryLocation(roomFromProfile);
    }
  }, [roomAssignments, profile?.metadata, deliveryLocation]);

  // Quick submit for non-restricted items (no sheet needed)
  const handleQuickSubmit = async () => {
    if (hasRestrictedItems) {
      setIsOpen(true);
      return;
    }
    
    setIsQuickSubmitting(true);
    try {
      await onSubmit({
        priority: 'medium',
        delivery_location: deliveryLocation,
        justification: 'Standard supply request',
      });
      // Reset form
      const meta = profile?.metadata as Record<string, unknown> | undefined;
      const roomFromProfile = meta?.room_number || meta?.office || '';
      setDeliveryLocation(roomFromProfile);
      setPriority('medium');
    } finally {
      setIsQuickSubmitting(false);
    }
  };

  const handleFullSubmit = async () => {
    await onSubmit({
      priority,
      delivery_location: deliveryLocation,
      justification: hasRestrictedItems && justification 
        ? justification 
        : 'Standard supply request',
    });
    setIsOpen(false);
    // Reset form
    const primaryRoom = roomAssignments?.find(a => a.is_primary);
    const firstRoom = roomAssignments?.[0];
    setDeliveryLocation(primaryRoom?.rooms?.room_number || firstRoom?.rooms?.room_number || '');
    setPriority('medium');
    setJustification('');
  };

  // Get restricted item names for display
  const restrictedItemNames = items
    .filter(i => i.requires_justification)
    .map(i => i.item_name);

  // Can quick submit: non-restricted items with 1-3 items
  const canQuickSubmit = !hasRestrictedItems && items.length <= 3;

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg pb-safe">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <div className="container mx-auto px-4 py-3">
          {/* Inline Justification for Restricted Items */}
          {hasRestrictedItems && (
            <div className="mb-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                  Approval Required for: {restrictedItemNames.join(', ')}
                </span>
              </div>
              <Textarea
                placeholder="Please explain why you need these items (required for approval)..."
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                className="min-h-[60px] text-sm"
              />
              <div className="flex justify-between mt-2">
                <span className="text-xs text-muted-foreground">
                  {justification.length}/200 characters
                </span>
                {deliveryLocation && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Deliver to: {deliveryLocation}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-4">
            {/* Summary - opens full sheet */}
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

            {/* Submit Button */}
            {hasRestrictedItems ? (
              // Restricted items: submit with justification
              <Button
                size="lg"
                className="shrink-0 gap-2"
                onClick={handleFullSubmit}
                disabled={isSubmitting || !justification.trim()}
              >
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {isSubmitting ? 'Submitting...' : 'Request Approval'}
                </span>
                <span className="sm:hidden">
                  {isSubmitting ? '...' : 'Submit'}
                </span>
              </Button>
            ) : canQuickSubmit ? (
              // Simple orders: quick submit
              <Button
                size="lg"
                className="shrink-0 gap-2 bg-green-600 hover:bg-green-700"
                onClick={handleQuickSubmit}
                disabled={isSubmitting || isQuickSubmitting}
              >
                <Zap className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {isQuickSubmitting ? 'Submitting...' : 'Quick Submit'}
                </span>
                <span className="sm:hidden">
                  {isQuickSubmitting ? '...' : 'Submit'}
                </span>
              </Button>
            ) : (
              // More than 3 items: review first
              <Button
                size="lg"
                className="shrink-0 gap-2"
                onClick={() => setIsOpen(true)}
                disabled={isSubmitting}
              >
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline">Review & Submit</span>
                <span className="sm:hidden">Review</span>
              </Button>
            )}
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
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg",
                  item.requires_justification 
                    ? "bg-amber-500/10 border border-amber-500/30" 
                    : "bg-muted/50"
                )}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate flex items-center gap-2">
                    {item.item_name}
                    {item.requires_justification && (
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                    )}
                  </p>
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
            {/* Justification - only shown for restricted items */}
            {hasRestrictedItems && (
              <div className="space-y-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <Label htmlFor="justification" className="text-sm flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4" />
                  Justification Required
                </Label>
                <p className="text-xs text-muted-foreground">
                  Items requiring approval: {restrictedItemNames.join(', ')}
                </p>
                <Textarea
                  id="justification"
                  placeholder="Please explain why you need these items..."
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
            )}

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
              onClick={handleFullSubmit}
              disabled={isSubmitting || (hasRestrictedItems && !justification.trim())}
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
