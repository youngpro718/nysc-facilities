import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { submitSupplyOrder } from '@/services/supplyOrdersService';
import { useToast } from '@/hooks/use-toast';
import { useGenerateReceipt } from '@/hooks/useSupplyReceipts';
import { createReceiptData } from '@/lib/receiptUtils';
import { useAuth } from '@/hooks/useAuth';

export interface CartItem {
  item_id: string;
  quantity: number;
  item_name: string;
  item_unit?: string;
  item_sku?: string;
}

export function useOrderCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { mutateAsync: generateReceipt } = useGenerateReceipt();
  const { user } = useAuth();

  const addItem = useCallback((item: { id: string; name: string; unit?: string; sku?: string }, quantity: number = 1) => {
    setCartItems(prev => {
      const existingIndex = prev.findIndex(i => i.item_id === item.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      }
      return [...prev, {
        item_id: item.id,
        quantity,
        item_name: item.name,
        item_unit: item.unit,
        item_sku: item.sku,
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
    priority?: 'low' | 'medium' | 'high';
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

    setIsSubmitting(true);
    try {
      // Auto-generate title from items if not provided
      const autoTitle = options?.title || 
        `Request for ${cartItems.slice(0, 3).map(i => i.item_name).join(', ')}${cartItems.length > 3 ? '...' : ''}`;

      const payload = {
        title: autoTitle,
        description: options?.description || '',
        justification: options?.justification || 'Standard supply request',
        priority: (options?.priority || 'medium') as 'low' | 'medium' | 'high',
        delivery_location: options?.delivery_location || '',
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
          console.error('Failed to generate receipt:', receiptError);
          // Don't fail the order if receipt generation fails
        }
      }
      
      toast({
        title: 'Order submitted',
        description: result?.approval_required
          ? 'Your order requires manager approval. A confirmation receipt has been generated.'
          : 'Your order was submitted successfully. Check your receipt for details.',
      });

      queryClient.invalidateQueries({ queryKey: ['supply-requests'] });
      clearCart();
      return result;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to submit order',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [cartItems, toast, queryClient, clearCart, user]);

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return {
    cartItems,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    submitOrder,
    totalItems,
    isSubmitting,
  };
}
