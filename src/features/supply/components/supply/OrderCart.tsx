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
import { DeliveryRoomPicker } from '@features/supply/components/supply/DeliveryRoomPicker';
import { RoomPrinterToners } from '@features/supply/components/supply/RoomPrinterToners';
import {
  useRoomPrinters,
  flagRoomForPrinterAssignment,
} from '@features/supply/hooks/useRoomPrinters';
import { useProfileCompleteness } from '@features/supply/hooks/useProfileCompleteness';

import { formatPackEquivalent } from '@features/supply/utils/packEquivalent';
import {
  verifySupplyOrderCode,
  verifySupervisorCode,
} from '@features/supply/services/supplyOrderCode';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface OrderCartProps {
  items: CartItem[];
  totalItems: number;
  onRemove: (itemId: string) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onSubmit: (options?: Record<string, unknown>) => Promise<unknown>;
  onClear: () => void;
  isSubmitting: boolean;
  requiresOrderCode?: boolean;
  /** Cart contains at least one item flagged (item- or category-level) as
   * needing supervisor approval. Cart swaps in a "supervisor code" prompt. */
  needsSupervisorApproval?: boolean;
  /** Cart items driving the supervisor-approval prompt (item- or
   * category-level). Used for the copy in the prompt. */
  restrictedItems?: CartItem[];
  /**
   * Add an inventory item to the cart from within the order form (used by the
   * RoomPrinterToners "Add cartridge" action so users can order a toner
   * directly instead of leaving a note).
   */
  onAddInventoryItem?: (item: {
    id: string;
    name: string;
    unit?: string;
    sku?: string;
    requires_justification?: boolean;
    pack_size?: number | null;
    order_code_threshold?: number | null;
  }) => void;
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
  requiresOrderCode = false,
  needsSupervisorApproval = false,
  restrictedItems: restrictedFromParent,
  onAddInventoryItem,
}: OrderCartProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [orderCode, setOrderCode] = useState('');
  const [supervisorCode, setSupervisorCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [supervisorCodeError, setSupervisorCodeError] = useState<string | null>(null);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const { user } = useAuth();
  const profile = useProfileCompleteness(user?.id);

  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [deliveryRoomId, setDeliveryRoomId] = useState<string | undefined>(undefined);
  const [manualToner, setManualToner] = useState('');
  const [priority, setPriority] = useState<'medium' | 'high' | 'urgent'>('medium');
  const [reason, setReason] = useState<string>('Standard supply request');
  const [neededBy, setNeededBy] = useState<string>('');

  const { data: roomPrinters = [] } = useRoomPrinters(deliveryRoomId);
  useEffect(() => {
    if (!deliveryRoomId) setManualToner('');
  }, [deliveryRoomId]);

  const cartItemIds = useMemo(() => items.map((i) => i.item_id), [items]);

  // Approval is item- or category-driven: any flagged item routes the whole
  // order through the supervisor-code prompt. Local `requires_justification`
  // covers item-level flags; parent supplies the category-driven set.
  const restrictedItems = useMemo(() => {
    if (restrictedFromParent && restrictedFromParent.length > 0) return restrictedFromParent;
    return items.filter(i => i.requires_justification);
  }, [items, restrictedFromParent]);
  const hasRestrictedItems = needsSupervisorApproval || restrictedItems.length > 0;
  const needsApproval = hasRestrictedItems;
  const trimmedLocation = deliveryLocation.trim();
  const missingLocation = trimmedLocation.length === 0;
  const locationRoomNumber = trimmedLocation
    .replace(/^room\s+/i, '')
    .split(/\s*[—-]\s*/)[0]
    .trim()
    .toLowerCase();
  const isDifferentFromHome =
    !!profile.homeRoomNumber &&
    trimmedLocation.length > 0 &&
    locationRoomNumber !== profile.homeRoomNumber.toLowerCase();

  const approvalReason = restrictedItems.length > 0
    ? `Contains ${restrictedItems.length === 1 ? '' : restrictedItems.length + ' '}item${restrictedItems.length === 1 ? '' : 's'} that need supervisor approval: ${restrictedItems.map(i => i.item_name).join(', ')}`
    : null;

  const handleSubmit = async () => {
    if (missingLocation) return; // hard-block: need a delivery location

    // Large orders (a line over its per-item limit) need the orderer's personal
    // access code. Verified server-side; no human approval wait.
    if (requiresOrderCode) {
      const code = orderCode.trim();
      if (!code) {
        setCodeError('Enter your access code to place this larger order.');
        return;
      }
      setVerifyingCode(true);
      try {
        const ok = await verifySupplyOrderCode(code);
        if (!ok) {
          setCodeError('That code was not recognized. Ask an admin if you need access for large orders.');
          return;
        }
      } catch {
        setCodeError('Could not verify the code right now. Please try again.');
        return;
      } finally {
        setVerifyingCode(false);
      }
      setCodeError(null);
    }

    // Items flagged (item- or category-level) for supervisor approval need a
    // supervisor's 4-digit code. Verified server-side; a valid code stamps
    // the request with approved_by_supervisor_id, skipping the pending queue
    // and firing a notification to that supervisor.
    let approvedSupervisorId: string | null = null;
    if (needsApproval) {
      const supCode = supervisorCode.trim();
      if (!supCode) {
        setSupervisorCodeError("Enter your supervisor's code to approve this order.");
        return;
      }
      setVerifyingCode(true);
      try {
        approvedSupervisorId = await verifySupervisorCode(supCode);
        if (!approvedSupervisorId) {
          setSupervisorCodeError("That code doesn't belong to a supervisor. Ask your supervisor for their 4-digit code.");
          return;
        }
      } catch {
        setSupervisorCodeError('Could not verify the supervisor code right now. Please try again.');
        return;
      } finally {
        setVerifyingCode(false);
      }
      setSupervisorCodeError(null);
    }

    // Manual toner entry is a fallback for rooms with no printers on file.
    // Room-linked toners are added to the cart directly as inventory items.
    const manual = manualToner.trim();
    const tonerNote = manual
      ? `Toner requested manually: ${manual}`
      : '';

    if (deliveryRoomId && roomPrinters.length === 0 && manual) {
      try {
        await flagRoomForPrinterAssignment(deliveryRoomId, user?.id);
      } catch {
        // Non-blocking — the order still submits.
      }
    }

    await onSubmit({
      priority,
      delivery_location: trimmedLocation,
      justification: reason,
      requested_delivery_date: neededBy || undefined,
      description: tonerNote || undefined,
      approved_by_supervisor_id: approvedSupervisorId,
    });
    setOrderCode('');
    setSupervisorCode('');
    setManualToner('');
    setIsOpen(false);
  };

  if (totalItems === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          onClick={() => setIsOpen(true)}
          className={cn(
            "fixed bottom-24 right-4 h-12 px-5 rounded-full shadow-xl z-40 touch-manipulation pb-safe inline-flex items-center gap-2 text-sm font-semibold w-auto",
            isOpen && "invisible pointer-events-none",
          )}
        >
          <ShoppingCart className="h-4 w-4" />
          <span>{`Review ${totalItems} item${totalItems === 1 ? '' : 's'}`}</span>
        </Button>
      </DialogTrigger>
      <DialogContent
        className="!grid-cols-none flex flex-col p-0 gap-0 sm:max-w-[520px] max-h-[85vh] overflow-hidden"
      >
        <DialogHeader className="px-4 pt-4 pb-3 shrink-0 border-b text-left">
          <DialogTitle className="text-base">Review your order</DialogTitle>
          <DialogDescription className="text-xs">
            {items.length === 0
              ? 'Your cart is empty'
              : `${items.length} line${items.length !== 1 ? 's' : ''} · ${totalItems} unit${totalItems !== 1 ? 's' : ''} total`}
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <ShoppingCart className="h-10 w-10 text-muted-foreground opacity-50 mb-2" />
              <p className="text-sm text-muted-foreground">
                Add items from the catalog to get started
              </p>
            </div>
          ) : (
            <>
              {/* Approval notice (if needed) — hidden when the access-code path applies */}
              {needsApproval && !requiresOrderCode && (
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
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {item.item_unit || 'each'}
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
                        className="p-2 -m-1 rounded-full text-muted-foreground hover:text-destructive transition-all touch-manipulation"
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
                        className="h-11 w-11 rounded-full touch-manipulation"
                        onClick={() => {
                          if (item.quantity <= 1) onRemove(item.item_id);
                          else onUpdateQuantity(item.item_id, item.quantity - 1);
                        }}
                        aria-label="Decrease"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="font-semibold text-base tabular-nums min-w-[2ch] text-center">
                        {item.quantity}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-11 w-11 rounded-full touch-manipulation"
                        onClick={() => onUpdateQuantity(item.item_id, item.quantity + 1)}
                        aria-label="Increase"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {item.pack_size && item.quantity % item.pack_size === 0 && (
                      <div className="text-[11px] text-muted-foreground text-right">
                        {formatPackEquivalent(item.quantity, item.item_unit, item.pack_size)}
                      </div>
                    )}
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
                  {profile.homeRoomNumber && !deliveryLocation && (
                    <button
                      type="button"
                      onClick={() => setDeliveryLocation(`Room ${profile.homeRoomNumber}`)}
                      className="text-[10px] text-primary hover:underline"
                    >
                      Use home room {profile.homeRoomNumber}
                    </button>
                  )}
                </div>
                <DeliveryRoomPicker
                  value={deliveryLocation}
                  onChange={(label, roomId) => {
                    setDeliveryLocation(label);
                    setDeliveryRoomId(roomId);
                  }}
                  userId={user?.id}
                  invalid={missingLocation}
                  placeholder="Search for a room…"
                  ariaLabel="Delivery room"
                />
                {missingLocation && (
                  <p className="text-xs text-destructive">
                    A delivery location is required so staff knows where to bring your order.
                  </p>
                )}
                {!missingLocation && isDifferentFromHome && (
                  <p className="text-[11px] text-muted-foreground">
                    Heads up — you're sending this to {trimmedLocation}, not your home room ({profile.homeRoomNumber}).
                  </p>
                )}
                <RoomPrinterToners
                  roomId={deliveryRoomId}
                  cartItemIds={cartItemIds}
                  onAddInventoryItem={(item) => onAddInventoryItem?.(item)}
                  onRemoveInventoryItem={(id) => onRemove(id)}
                  manualToner={manualToner}
                  onManualTonerChange={setManualToner}
                />

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
                        aria-pressed={active}
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
                        aria-pressed={active}
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
                <Label htmlFor="supply-needed-by" className="text-xs font-medium flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Needed by (optional)
                </Label>
                <Input
                  id="supply-needed-by"
                  type="date"
                  value={neededBy}
                  onChange={(e) => setNeededBy(e.target.value)}
                  className="h-11"
                  min={new Date().toISOString().slice(0, 10)}
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

        {/* Footer — pinned at bottom of modal */}
        {items.length > 0 && (
          <div className="shrink-0 p-3 border-t bg-background space-y-2">
            {requiresOrderCode && (
              <div className="space-y-1.5 rounded-lg border border-primary/30 bg-primary/5 p-2.5">
                <Label htmlFor="order-code" className="text-xs font-medium">
                  Access code required
                </Label>
                <Input
                  id="order-code"
                  type="password"
                  inputMode="numeric"
                  autoComplete="off"
                  value={orderCode}
                  onChange={(e) => { setOrderCode(e.target.value); if (codeError) setCodeError(null); }}
                  placeholder="Enter your personal code"
                  className="h-10"
                />
                {codeError ? (
                  <p className="text-xs text-destructive">{codeError}</p>
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    {/* New tab: the cart is in-memory state, so navigating away here would wipe the order they're authorizing */}
                    This order meets or exceeds the limit for an item. Enter your personal code to authorize it instantly — no supervisor wait. You can find your code on your <a href="/profile" target="_blank" rel="noopener" className="underline">Profile page</a>.
                  </p>
                )}
              </div>
            )}
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || verifyingCode || missingLocation}
              className="w-full h-11 text-sm font-semibold"
            >
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting
                ? 'Submitting…'
                : verifyingCode
                  ? 'Checking code…'
                  : missingLocation
                    ? 'Add a delivery location to submit'
                    : requiresOrderCode
                      ? `Authorize & submit (${totalItems} item${totalItems === 1 ? '' : 's'})`
                      : needsApproval
                        ? `Send ${totalItems} item${totalItems === 1 ? '' : 's'} for approval`
                        : `Submit order (${totalItems} item${totalItems === 1 ? '' : 's'})`}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
