/**
 * OrderSummaryFooter - Modern floating cart footer
 * 
 * Features:
 * - Clean floating design
 * - Quick submit for simple orders
 * - Inline justification for restricted items
 * - Smooth sheet transitions
 */

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
import { 
  ShoppingCart, 
  Send, 
  Trash2, 
  ChevronUp, 
  MapPin, 
  AlertTriangle, 
  Zap, 
  Minus, 
  Plus,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@features/auth/hooks/useAuth';
import { useUserRoomAssignments } from '@features/spaces/hooks/useUserRoomAssignments';
import type { CartItem } from '@features/supply/hooks/useOrderCart';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [showSuccess, setShowSuccess] = useState(false);

  const { profile, user } = useAuth();
  const { data: roomAssignments } = useUserRoomAssignments(user?.id);

  // Pre-fill delivery location
  useEffect(() => {
    if (deliveryLocation) return;
    
    const primaryRoom = roomAssignments?.find(a => a.is_primary);
    const firstRoom = roomAssignments?.[0];
    const roomFromAssignment = primaryRoom?.rooms?.room_number || firstRoom?.rooms?.room_number;
    
    if (roomFromAssignment) {
      setDeliveryLocation(roomFromAssignment);
      return;
    }
    
    const meta = profile?.metadata as Record<string, any> | undefined;
    const roomFromProfile = meta?.room_number || meta?.office || '';
    if (roomFromProfile) {
      setDeliveryLocation(roomFromProfile);
    }
  }, [roomAssignments, profile?.metadata, deliveryLocation]);

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
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
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
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
    
    const primaryRoom = roomAssignments?.find(a => a.is_primary);
    const firstRoom = roomAssignments?.[0];
    setDeliveryLocation(primaryRoom?.rooms?.room_number || firstRoom?.rooms?.room_number || '');
    setPriority('medium');
    setJustification('');
  };

  const restrictedItemNames = items
    .filter(i => i.requires_justification)
    .map(i => i.item_name);

  const canQuickSubmit = !hasRestrictedItems && items.length <= 3;

  if (items.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 p-3 pb-safe"
      >
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <div className={cn(
            "mx-auto max-w-3xl rounded-2xl border shadow-2xl",
            "bg-background/95 backdrop-blur-xl"
          )}>
            {/* Inline Justification for Restricted Items */}
            {hasRestrictedItems && (
              <div className="p-3 border-b border-amber-500/20 bg-amber-500/5 rounded-t-2xl">
                <div className="flex items-start gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                      Approval needed
                    </span>
                    <p className="text-xs text-amber-600/70 dark:text-amber-400/70 truncate">
                      {restrictedItemNames.join(', ')}
                    </p>
                  </div>
                </div>
                <Textarea
                  placeholder="Why do you need these items?"
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  className="min-h-[50px] text-sm bg-background/50 border-amber-500/30 focus-visible:ring-amber-500/30"
                />
              </div>
            )}

            <div className="flex items-center gap-3 p-3">
              {/* Cart Summary */}
              <SheetTrigger asChild>
                <button className="flex items-center gap-3 flex-1 min-w-0 text-left group">
                  <div className="relative">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                      "bg-primary/10 group-hover:bg-primary/20"
                    )}>
                      <ShoppingCart className="h-5 w-5 text-primary" />
                    </div>
                    <Badge 
                      className="absolute -top-1.5 -right-1.5 h-5 min-w-[1.25rem] px-1 flex items-center justify-center text-xs font-bold"
                    >
                      {totalItems}
                    </Badge>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm">
                      {items.length} item{items.length !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {items.slice(0, 2).map(i => i.item_name).join(', ')}
                      {items.length > 2 && ` +${items.length - 2}`}
                    </p>
                  </div>
                  <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>
              </SheetTrigger>

              {/* Submit Button */}
              {hasRestrictedItems ? (
                <Button
                  size="lg"
                  className="shrink-0 rounded-xl h-12 px-5 gap-2 font-semibold"
                  onClick={handleFullSubmit}
                  disabled={isSubmitting || !justification.trim()}
                >
                  <Send className="h-4 w-4" />
                  <span className="hidden sm:inline">Request Approval</span>
                  <span className="sm:hidden">Submit</span>
                </Button>
              ) : canQuickSubmit ? (
                <Button
                  size="lg"
                  className={cn(
                    "shrink-0 rounded-xl h-12 px-5 gap-2 font-semibold transition-all",
                    showSuccess 
                      ? "bg-emerald-500 hover:bg-emerald-500" 
                      : "bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
                  )}
                  onClick={handleQuickSubmit}
                  disabled={isSubmitting || isQuickSubmitting}
                >
                  {showSuccess ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Sent!</span>
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      <span className="hidden sm:inline">Quick Order</span>
                      <span className="sm:hidden">Order</span>
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  size="lg"
                  className="shrink-0 rounded-xl h-12 px-5 gap-2 font-semibold"
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

          <SheetContent side="bottom" className="h-[90dvh] flex flex-col rounded-t-3xl">
            <SheetHeader className="text-left pb-2">
              <div className="flex justify-center pt-1 pb-3">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
              </div>
              <SheetTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <span className="block">Your Order</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {totalItems} items total
                  </span>
                </div>
              </SheetTitle>
            </SheetHeader>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto py-3 -mx-6 px-6 space-y-2">
              {items.map((item) => (
                <motion.div
                  key={item.item_id}
                  layout
                  className={cn(
                    "rounded-xl border p-3",
                    item.requires_justification 
                      ? "bg-amber-500/5 border-amber-500/30" 
                      : "bg-muted/30"
                  )}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm leading-tight flex items-center gap-2">
                        <span className="truncate">{item.item_name}</span>
                        {item.requires_justification && (
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        )}
                      </p>
                      {item.item_sku && (
                        <span className="text-[11px] font-mono text-muted-foreground">
                          {item.item_sku}
                        </span>
                      )}
                    </div>
                    <button
                      className="p-1.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      onClick={() => onRemove(item.item_id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {/* Quantity stepper */}
                  <div className="flex items-center justify-between bg-background rounded-lg px-2 py-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-full"
                      onClick={() => {
                        if (item.quantity <= 1) onRemove(item.item_id);
                        else onUpdateQuantity(item.item_id, item.quantity - 1);
                      }}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base tabular-nums">
                        {item.quantity}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {item.item_unit || 'units'}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-full"
                      onClick={() => onUpdateQuantity(item.item_id, item.quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Order Options */}
            <div className="border-t pt-4 space-y-4 -mx-6 px-6">
              {hasRestrictedItems && (
                <div className="space-y-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                  <Label className="text-sm flex items-center gap-2 text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="h-4 w-4" />
                    Justification Required
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    For: {restrictedItemNames.join(', ')}
                  </p>
                  <Textarea
                    placeholder="Please explain why you need these items..."
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    className="min-h-[70px] bg-background"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    Deliver to
                  </Label>
                  <Input
                    placeholder="Room 205"
                    value={deliveryLocation}
                    onChange={(e) => setDeliveryLocation(e.target.value)}
                    className="h-10 rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger className="h-10 rounded-xl">
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

            <SheetFooter className="flex-row gap-3 pt-4 -mx-6 px-6 pb-safe">
              <Button
                variant="outline"
                className="flex-1 h-12 rounded-xl"
                onClick={onClear}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
              </Button>
              <Button
                className="flex-1 h-12 rounded-xl font-semibold"
                onClick={handleFullSubmit}
                disabled={isSubmitting || (hasRestrictedItems && !justification.trim())}
              >
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Submitting...' : 'Submit Order'}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </motion.div>
    </AnimatePresence>
  );
}
