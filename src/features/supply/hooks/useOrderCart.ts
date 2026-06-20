import { useState, useCallback, useRef } from 'react';
import { logger } from '@/lib/logger';
import { useQueryClient } from '@tanstack/react-query';
import { submitSupplyOrder } from '@features/supply/services/unifiedSupplyService';
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

  // Supervisors (court_officer, cmc, admin) bypass restricted item approval
  const isSupervisor = ['court_officer', 'court_liaison', 'admin'].includes(profile?.role || '');

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
  const hasRestrictedItems = !isSupervisor && cartItems.some(item => item.requires_justification === true);
  // Lines above their per-item threshold need the orderer's personal access code.
  // Supervisors are exempt (same bypass as restricted-item approval).
  const requiresOrderCode = !isSupervisor && cartItems.some(
    item => item.order_code_threshold != null && item.quantity > item.order_code_threshold,
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
    requiresOrderCode,
  };
}
