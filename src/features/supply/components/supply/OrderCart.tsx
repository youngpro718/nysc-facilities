import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  ShoppingCart,
  X,
  Send,
  Minus,
  Plus,
  AlertTriangle,
  MapPin,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CartItem } from '@features/supply/hooks/useOrderCart';
import { useAuth } from '@features/auth/hooks/useAuth';
import { useDeliveryLocations } from '@features/supply/hooks/useDeliveryLocations';
import { DeliveryRoomPicker } from '@features/supply/components/supply/DeliveryRoomPicker';
import { useProfileCompleteness } from '@features/supply/hooks/useProfileCompleteness';
import { ProfileIncompleteBanner } from '@features/supply/components/supply/ProfileIncompleteBanner';
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

const REASON_CHIPS = [
  { value: 'Standard supply request', label: 'Restocking' },
  { value: 'New employee setup', label: 'New person' },
  { value: 'Special project', label: 'Project' },
  { value: 'Replacement', label: 'Replacement' },
];

const PRIORITY_PILLS: Array<{ value: 'medium' | 'high' | 'urgent'; label: string }> = [
  { value: 'medium', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

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
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const { user } = useAuth();
  const { options: locationOptions, defaultLocation } = useDeliveryLocations(user?.id);
  const profile = useProfileCompleteness(user?.id);

  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [priority, setPriority] = useState<'medium' | 'high' | 'urgent'>('medium');
  const [reason, setReason] = useState<string>('Standard supply request');
  const [neededBy, setNeededBy] = useState<string>('');

  // Pre-fill delivery location once when defaults arrive / sheet opens
  useEffect(() => {
    if (!deliveryLocation && defaultLocation) setDeliveryLocation(defaultLocation);
  }, [defaultLocation, deliveryLocation]);

  const restrictedItems = useMemo(
    () => items.filter(i => i.requires_justification),
    [items]
  );
  const hasRestrictedItems = restrictedItems.length > 0;
  const totalQty = items.reduce((s, i) => s + i.quantity, 0);
  const maxLineQty = items.reduce((m, i) => Math.max(m, i.quantity), 0);
  const highQuantity = maxLineQty >= 25 || totalQty >= 50;
  const needsApproval = hasRestrictedItems || highQuantity;
  const trimmedLocation = deliveryLocation.trim();
  const missingLocation = trimmedLocation.length === 0;
  const isDifferentFromHome =
    !!profile.homeRoomNumber &&
    trimmedLocation.length > 0 &&
    trimmedLocation.toLowerCase() !== profile.homeRoomNumber.toLowerCase();

  const approvalReason = hasRestrictedItems
    ? `Contains ${restrictedItems.length === 1 ? '' : restrictedItems.length + ' '}restricted item${restrictedItems.length === 1 ? '' : 's'}: ${restrictedItems.map(i => i.item_name).join(', ')}`
    : highQuantity
      ? `High quantity (${totalQty} units total)`
      : null;

  const handleSubmit = async () => {
    setAttemptedSubmit(true);
    if (missingLocation) return; // hard-block: need a delivery location
    await onSubmit({
      priority,
      delivery_location: trimmedLocation,
      justification: reason,
      requested_delivery_date: neededBy || undefined,
    });
    setAttemptedSubmit(false);
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          className="fixed bottom-24 inset-x-3 h-12 rounded-full shadow-xl z-50 touch-manipulation pb-safe flex items-center justify-center gap-2 text-sm font-semibold"
          disabled={totalItems === 0}
        >
          <ShoppingCart className="h-4 w-4" />
          <span>
            {totalItems === 0
              ? 'Cart is empty'
              : `Review ${totalItems} item${totalItems === 1 ? '' : 's'}`}
          </span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="h-[92dvh] flex flex-col p-0 rounded-t-2xl"
      >
        <SheetHeader className="px-4 pt-4 pb-2 shrink-0 border-b">
          <SheetTitle className="text-base">Review your order</SheetTitle>
          <SheetDescription className="text-xs">
            {items.length === 0
              ? 'Your cart is empty'
              : `${items.length} item${items.length !== 1 ? 's' : ''} • ${totalItems} total`}
          </SheetDescription>
        </SheetHeader>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 pb-32">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <ShoppingCart className="h-10 w-10 text-muted-foreground opacity-50 mb-2" />
              <p className="text-sm text-muted-foreground">
                Add items from the catalog to get started
              </p>
            </div>
          ) : (
            <>
              {/* Profile completeness banner — shows when department/home room missing */}
              <ProfileIncompleteBanner />

              {/* Approval notice (if needed) */}
              {needsApproval && (
                <div className="flex gap-2 p-3 rounded-lg border border-amber-500/30 bg-amber-500/5">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-medium text-amber-700 dark:text-amber-400">
                      This order needs supervisor approval
                    </p>
                    <p className="text-amber-700/80 dark:text-amber-400/80 mt-0.5">
                      {approvalReason}. Usually approved in under one business day.
                    </p>
                  </div>
                </div>
              )}

              {/* Items */}
              <div className="space-y-2">
                {items.map(item => (
                  <div
                    key={item.item_id}
                    className="flex flex-col gap-1.5 p-2.5 border rounded-lg"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm break-words">
                          {item.item_name}
                        </div>
                        {item.requires_justification && (
                          <Badge
                            variant="outline"
                            className="mt-1 h-5 px-1.5 text-[10px] font-medium border-amber-500/40 text-amber-700 dark:text-amber-400 bg-amber-500/5"
                          >
                            Needs approval
                          </Badge>
                        )}
                      </div>
                      <button
                        className="p-2 -m-1 rounded-full text-muted-foreground hover:text-destructive active:scale-90 transition-all touch-manipulation"
                        onClick={() => onRemove(item.item_id)}
                        aria-label="Remove item"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between bg-muted/50 rounded-lg px-2 py-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-11 w-11 rounded-full touch-manipulation active:scale-95"
                        onClick={() => {
                          if (item.quantity <= 1) onRemove(item.item_id);
                          else onUpdateQuantity(item.item_id, item.quantity - 1);
                        }}
                        aria-label="Decrease"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-base tabular-nums min-w-[2ch] text-center">
                          {item.quantity}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {item.item_unit || 'units'}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-11 w-11 rounded-full touch-manipulation active:scale-95"
                        onClick={() => onUpdateQuantity(item.item_id, item.quantity + 1)}
                        aria-label="Increase"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Delivery */}
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <Label className="text-xs font-medium flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    Deliver to <span className="text-destructive">*</span>
                  </Label>
                  {profile.homeRoomNumber && (
                    <span className="text-[10px] text-muted-foreground">
                      Home room: {profile.homeRoomNumber}
                    </span>
                  )}
                </div>
                <DeliveryRoomPicker
                  value={deliveryLocation}
                  onChange={setDeliveryLocation}
                  userId={user?.id}
                  invalid={attemptedSubmit && missingLocation}
                  placeholder="Search for a room…"
                />
                {attemptedSubmit && missingLocation && (
                  <p className="text-xs text-destructive">
                    A delivery location is required so staff knows where to bring your order.
                  </p>
                )}
                {!missingLocation && isDifferentFromHome && (
                  <p className="text-[11px] text-muted-foreground">
                    Heads up — you're sending this to {trimmedLocation}, not your home room ({profile.homeRoomNumber}).
                  </p>
                )}
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Priority</Label>
                <div className="grid grid-cols-3 gap-2">
                  {PRIORITY_PILLS.map(p => {
                    const active = priority === p.value;
                    return (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setPriority(p.value)}
                        className={cn(
                          'h-11 rounded-lg border text-sm font-medium touch-manipulation transition-colors',
                          active
                            ? p.value === 'urgent'
                              ? 'border-destructive bg-destructive text-destructive-foreground'
                              : p.value === 'high'
                                ? 'border-amber-500 bg-amber-500 text-white'
                                : 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-background hover:bg-muted'
                        )}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Reason (optional)</Label>
                <div className="flex flex-wrap gap-1.5">
                  {REASON_CHIPS.map(chip => {
                    const active = reason === chip.value;
                    return (
                      <button
                        key={chip.value}
                        type="button"
                        onClick={() => setReason(chip.value)}
                        className={cn(
                          'h-8 px-3 rounded-full border text-xs font-medium touch-manipulation transition-colors',
                          active
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-background hover:bg-muted'
                        )}
                      >
                        {chip.label}
                      </button>
                    );
                  })}
                </div>
                {hasRestrictedItems && (
                  <Textarea
                    placeholder="Tell the approver why you need these items"
                    value={reason.startsWith('Standard') ? '' : reason}
                    onChange={(e) => setReason(e.target.value || 'Standard supply request')}
                    className="min-h-[60px] text-sm"
                  />
                )}
              </div>

              {/* Needed by */}
              <div className="space-y-2">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Needed by (optional)
                </Label>
                <Input
                  type="date"
                  value={neededBy}
                  onChange={(e) => setNeededBy(e.target.value)}
                  className="h-11"
                />
              </div>

              <button
                type="button"
                onClick={onClear}
                className="text-xs text-muted-foreground underline-offset-4 hover:underline"
              >
                Clear cart
              </button>
            </>
          )}
        </div>

        {/* Sticky submit bar */}
        {items.length > 0 && (
          <div className="absolute bottom-0 inset-x-0 p-3 pb-safe border-t bg-background/95 backdrop-blur space-y-1.5">
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full h-12 text-sm font-semibold"
            >
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting
                ? 'Submitting…'
                : missingLocation
                  ? 'Add a delivery location to submit'
                  : needsApproval
                    ? `Send ${totalItems} item${totalItems === 1 ? '' : 's'} for approval`
                    : `Submit order (${totalItems} item${totalItems === 1 ? '' : 's'})`}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
