import { useState, useCallback, useRef, useMemo } from 'react';
import { logger } from '@/lib/logger';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  submitSupplyOrder,
  revalidateCatalogStock,
  fetchRestrictedItemIds,
} from '@features/supply/services/unifiedSupplyService';

// Sentinel error type for the submit-time stock check. Thrown so the normal
// finally-block cleanup runs (reset isSubmitting + ref), but caught in the
// generic error branch as a no-op so it doesn't get masked by the RLS toast.
class StockUnavailableError extends Error {
  constructor() {
    super('Some items are no longer available');
    this.name = 'StockUnavailableError';
  }
}
import { useToast } from '@shared/hooks/use-toast';
import { useGenerateReceipt } from '@features/supply/hooks/useSupplyReceipts';
import { createReceiptData } from '@/lib/receiptUtils';
import { useAuth } from '@features/auth/hooks/useAuth';
import { requestSubmittedToast, requestFailedToast } from '@shared/utils/requestToast';

export interface CartItem {
  item_id: string;
  quantity: number;
  item_name: string;
  item_unit?: string;
  item_sku?: string;
  requires_justification?: boolean;
  pack_size?: number | null;
  order_code_threshold?: number | null;
}

export function useOrderCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Synchronous re-entrancy latch: a fast double-tap can fire submit twice
  // before the isSubmitting state re-render disables the button. The ref
  // flips immediately, so the second call is dropped and no duplicate order
  // is created.
  const submittingRef = useRef(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { mutateAsync: generateReceipt } = useGenerateReceipt();
  const { user, profile } = useAuth();

  // Supervisors (court_officer, court_liaison, admin) bypass the
  // "requires_justification" approval gate (they don't need to approve their
  // own orders).
  const isSupervisor = ['court_officer', 'court_liaison', 'admin'].includes(profile?.role || '');
  // Per-user opt-in (admin-toggled) to skip the code prompt entirely. Set on
  // the profile via the admin user menu. The user's code still exists for
  // someone ordering on their behalf.
  const bypassOrderCode = profile?.bypass_supply_order_code === true;

  const addItem = useCallback((item: { id: string; name: string; unit?: string; sku?: string; requires_justification?: boolean; pack_size?: number | null; order_code_threshold?: number | null }, quantity: number = 1) => {
    setCartItems(prev => {
      const existingIndex = prev.findIndex(i => i.item_id === item.id);
      if (existingIndex >= 0) {
        // Replace the item object (don't mutate in place) so memoized
        // consumers re-render correctly.
        return prev.map((it, idx) =>
          idx === existingIndex ? { ...it, quantity: it.quantity + quantity } : it
        );
      }
      return [...prev, {
        item_id: item.id,
        quantity,
        item_name: item.name,
        item_unit: item.unit,
        item_sku: item.sku,
        requires_justification: item.requires_justification,
        pack_size: item.pack_size ?? null,
        order_code_threshold: item.order_code_threshold ?? null,
      }];
    });
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setCartItems(prev => prev.filter(i => i.item_id !== itemId));
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    setCartItems(prev => prev.map(item => 
      item.item_id === itemId ? { ...item, quantity } : item
    ));
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const submitOrder = useCallback(async (options?: {
    title?: string;
    description?: string;
    justification?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    delivery_location?: string;
    requested_delivery_date?: string;
    approved_by_supervisor_id?: string | null;
  }) => {
    if (cartItems.length === 0) {
      toast({
        title: 'Cart is empty',
        description: 'Please add items to your cart before submitting.',
        variant: 'destructive',
      });
      return;
    }

    if (!user) {
      toast({
        title: 'Not authenticated',
        description: 'Please log in to submit orders.',
        variant: 'destructive',
      });
      return;
    }

    const deliveryLocation = options?.delivery_location?.trim();
    if (!deliveryLocation) {
      toast({
        title: 'Delivery location required',
        description: 'Select where the supply room should deliver this order.',
        variant: 'destructive',
      });
      return;
    }

    // Drop re-entrant submits (fast double-tap) before the disabled state paints
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      // Re-check stock right before submit — the catalog page could be minutes
      // old and another requester may have drained the shelf in the meantime.
      const outOfStockIds = await revalidateCatalogStock(cartItems.map(i => i.item_id));
      if (outOfStockIds.length > 0) {
        const affectedNames = outOfStockIds
          .map(id => cartItems.find(c => c.item_id === id)?.item_name)
          .filter((n): n is string => !!n);
        toast({
          title: 'Some items are no longer available',
          description: affectedNames.length > 0
            ? affectedNames.join(', ')
            : 'Please remove unavailable items and try again.',
          variant: 'destructive',
        });
        throw new StockUnavailableError();
      }

      // Auto-generate title from items if not provided
      const autoTitle = options?.title ||
        `Request for ${cartItems.slice(0, 3).map(i => i.item_name).join(', ')}${cartItems.length > 3 ? '...' : ''}`;

      const payload = {
        title: autoTitle,
        description: options?.description || '',
        justification: options?.justification || 'Standard supply request',
        priority: (options?.priority || 'medium') as 'low' | 'medium' | 'high' | 'urgent',
        delivery_location: deliveryLocation,
        requested_delivery_date: options?.requested_delivery_date || null,
        approved_by_supervisor_id: options?.approved_by_supervisor_id ?? null,
        items: cartItems.map(item => ({
          item_id: item.item_id,
          quantity_requested: item.quantity,
          notes: '',
        })),
      };

      const result = await submitSupplyOrder(payload);

      // Generate confirmation receipt
      if (result?.request) {
        try {
          const receiptData = createReceiptData(result.request, 'confirmation', '');
          await generateReceipt({
            requestId: result.request.id,
            receiptType: 'confirmation',
            receiptData,
          });
        } catch (receiptError) {
          logger.error('Failed to generate receipt:', receiptError);
        }
      }

      if (result?.request?.id) {
        requestSubmittedToast({
          id: result.request.id,
          type: 'supply',
          needsApproval: !!result?.approval_required,
        });
      }

      queryClient.invalidateQueries({ queryKey: ['supply-requests'] });
      queryClient.invalidateQueries({ queryKey: ['my-requests'] });
      // Also invalidate the recent-locations cache so the new location appears next time
      queryClient.invalidateQueries({ queryKey: ['supplyRecentDeliveryLocations'] });
      clearCart();

      return result;
    } catch (error: any) {
      // Submit-time stock rejection already showed its own toast; don't
      // double-toast or mask it with the generic RLS copy below.
      if (error instanceof StockUnavailableError) {
        throw error;
      }
      const raw = error?.message || 'Failed to submit order';
      const message =
        raw.includes('row-level security') || raw.includes('Permission')
          ? 'Permission error. Please try logging in again.'
          : raw;
      requestFailedToast(message);
      throw error;
    } finally {
      setIsSubmitting(false);
      submittingRef.current = false;
    }
  }, [cartItems, toast, queryClient, clearCart, user, isSupervisor]);

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Ask the server which cart items require supervisor approval — this covers
  // both item-level (requires_justification) and category-level
  // (inventory_categories.requires_supervisor_approval) flags. The client
  // uses this to swap in the "enter supervisor code" prompt.
  const cartItemIds = useMemo(() => cartItems.map(i => i.item_id).sort(), [cartItems]);
  const { data: serverRestrictedIds = [] } = useQuery({
    queryKey: ['supply-restricted-item-ids', cartItemIds],
    queryFn: () => fetchRestrictedItemIds(cartItemIds),
    enabled: cartItemIds.length > 0,
    staleTime: 60_000,
  });
  const hasRestrictedItems = !isSupervisor && (
    cartItems.some(item => item.requires_justification === true) ||
    serverRestrictedIds.length > 0
  );
  const restrictedCartItems = useMemo(() => {
    const set = new Set(serverRestrictedIds);
    return cartItems.filter(i => i.requires_justification === true || set.has(i.item_id));
  }, [cartItems, serverRestrictedIds]);

  // Lines at or above their per-item threshold need the orderer's personal
  // access code, unless this user has the admin-set bypass flag.
  const requiresOrderCode = !bypassOrderCode && cartItems.some(
    item => item.order_code_threshold != null && item.quantity >= item.order_code_threshold,
  );

  return {
    cartItems,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    submitOrder,
    totalItems,
    isSubmitting,
    hasRestrictedItems,
    restrictedCartItems,
    requiresOrderCode,
  };
}
