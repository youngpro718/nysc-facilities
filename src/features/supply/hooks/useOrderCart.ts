import { useState, useCallback, useRef } from 'react';
import { logger } from '@/lib/logger';
import { useQueryClient } from '@tanstack/react-query';
import { submitSupplyOrder } from '@features/supply/services/unifiedSupplyService';
import { useToast } from '@shared/hooks/use-toast';
import { useGenerateReceipt } from '@features/supply/hooks/useSupplyReceipts';
import { createReceiptData } from '@/lib/receiptUtils';
import { useAuth } from '@features/auth/hooks/useAuth';

export interface CartItem {
  item_id: string;
  quantity: number;
  item_name: string;
  item_unit?: string;
  item_sku?: string;
  requires_justification?: boolean;
  pack_size?: number | null;
}

export function useOrderCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Synchronous re-entrancy latch: a fast double-tap can fire submit twice
  // before the isSubmitting state re-render disables the button. The ref
  // flips immediately, so the second call is dropped and no duplicate order
  // is created.
  const submittingRef = useRef(false);
  const [submittedOrder, setSubmittedOrder] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { mutateAsync: generateReceipt } = useGenerateReceipt();
  const { user, profile } = useAuth();

  // Supervisors (court_officer, cmc, admin) bypass restricted item approval
  const isSupervisor = ['court_officer', 'court_liaison', 'admin'].includes(profile?.role || '');

  const addItem = useCallback((item: { id: string; name: string; unit?: string; sku?: string; requires_justification?: boolean; pack_size?: number | null }, quantity: number = 1) => {
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

      toast({
        title: result?.approval_required ? 'Sent for approval' : 'Order submitted',
        description: result?.approval_required && !isSupervisor
          ? (result?.approval_reason
              ? `${result.approval_reason}. A supervisor will review it shortly.`
              : 'A supervisor will review your order shortly.')
          : "Your order was submitted. We'll notify you when it's ready.",
      });

      queryClient.invalidateQueries({ queryKey: ['supply-requests'] });
      // Also invalidate the recent-locations cache so the new location appears next time
      queryClient.invalidateQueries({ queryKey: ['supplyRecentDeliveryLocations'] });
      clearCart();

      // Store the submitted order for the confirmation screen — include items + meta
      if (result?.request) {
        setSubmittedOrder({
          ...result.request,
          approval_required: result?.approval_required,
          approval_reason: result?.approval_reason,
          delivery_location: payload.delivery_location,
          priority: payload.priority,
          items: cartItems.map(i => ({
            item_name: i.item_name,
            quantity: i.quantity,
            item_unit: i.item_unit,
          })),
        });
      }

      return result;
    } catch (error: any) {
      const message = error?.message || 'Failed to submit order';
      toast({
        title: 'Submission Failed',
        description: message.includes('row-level security') || message.includes('Permission')
          ? 'Permission error. Please try logging in again.'
          : message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsSubmitting(false);
      submittingRef.current = false;
    }
  }, [cartItems, toast, queryClient, clearCart, user, isSupervisor]);

  const resetSubmittedOrder = useCallback(() => {
    setSubmittedOrder(null);
  }, []);

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const hasRestrictedItems = !isSupervisor && cartItems.some(item => item.requires_justification === true);

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
    submittedOrder,
    resetSubmittedOrder,
  };
}
