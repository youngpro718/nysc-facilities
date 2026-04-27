/**
 * Quick Reorder Dialog for low-stock items
 * Creates a supply request to restock inventory
 */
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@features/auth/hooks/useAuth';
import { ModalFrame } from '@shared/components/common/common/ModalFrame';
import { DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ShoppingCart, Package } from 'lucide-react';
import { getErrorMessage } from '@/lib/errorUtils';

interface QuickReorderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: {
    id: string;
    name: string;
    quantity: number;
    minimum_quantity: number;
    unit: string;
    preferred_vendor?: string;
  };
}

export function QuickReorderDialog({ open, onOpenChange, item }: QuickReorderDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Calculate suggested reorder quantity (2x minimum or at least replenish to minimum)
  const suggestedQty = Math.max(
    item.minimum_quantity - item.quantity,
    item.minimum_quantity * 2
  );
  
  const [quantity, setQuantity] = useState(suggestedQty);
  const [notes, setNotes] = useState('');

  const reorderMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');

      // Create a supply request for restocking
      const { data: request, error: requestError } = await supabase
        .from('supply_requests')
        .insert({
          requester_id: user.id,
          title: `Restock: ${item.name}`,
          priority: item.quantity === 0 ? 'high' : 'medium',
          status: 'submitted',
          notes: notes || `Reorder request for ${item.name}. Current stock: ${item.quantity} ${item.unit}, Min required: ${item.minimum_quantity} ${item.unit}`,
          metadata: {
            reorder_request: true,
            item_id: item.id,
            preferred_vendor: item.preferred_vendor,
          },
        })
        .select()
        .single();

      if (requestError) throw requestError;

      // Add the item to the request
      const { error: itemError } = await supabase
        .from('supply_request_items')
        .insert({
          request_id: request.id,
          item_id: item.id,
          quantity_requested: quantity,
        });

      if (itemError) throw itemError;

      return request;
    },
    onSuccess: () => {
      toast.success('Reorder request submitted', {
        description: `Request for ${quantity} ${item.unit} of ${item.name} has been submitted.`,
      });
      queryClient.invalidateQueries({ queryKey: ['supply-requests'] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error('Failed to submit reorder', {
        description: getErrorMessage(error),
      });
    },
  });

  return (
    <ModalFrame
      open={open}
      onOpenChange={onOpenChange}
      size="sm"
      title={
        <span className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Quick Reorder
        </span>
      }
      description="Create a supply request to restock this item"
    >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
            <Package className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-muted-foreground">
                Current: {item.quantity} {item.unit} • Min: {item.minimum_quantity} {item.unit}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity to Order</Label>
            <div className="flex items-center gap-2">
              <Input
                id="quantity"
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">{item.unit}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Suggested: {suggestedQty} {item.unit} (2× minimum level)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any special instructions or vendor preferences..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {item.preferred_vendor && (
            <p className="text-sm text-muted-foreground">
              Preferred vendor: <strong>{item.preferred_vendor}</strong>
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={() => reorderMutation.mutate()}
            disabled={reorderMutation.isPending || quantity < 1}
          >
            {reorderMutation.isPending ? 'Submitting...' : 'Submit Reorder'}
          </Button>
        </DialogFooter>
    </ModalFrame>
  );
}
