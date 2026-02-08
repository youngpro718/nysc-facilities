import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Package, TrendingUp, TrendingDown } from 'lucide-react';

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  unit: string;
  minimum_quantity: number;
}

interface InventoryAdjustmentDialogProps {
  item: InventoryItem | null;
  open: boolean;
  onClose: () => void;
}

export function InventoryAdjustmentDialog({
  item,
  open,
  onClose,
}: InventoryAdjustmentDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove'>('add');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');

  const adjustMutation = useMutation({
    mutationFn: async () => {
      if (!item || !quantity || !user) {
        throw new Error('Missing required data');
      }

      const adjustmentAmount = parseInt(quantity);
      if (isNaN(adjustmentAmount) || adjustmentAmount <= 0) {
        throw new Error('Please enter a valid quantity');
      }

      const previousQuantity = item.quantity;
      const newQuantity = adjustmentType === 'add' 
        ? previousQuantity + adjustmentAmount
        : Math.max(0, previousQuantity - adjustmentAmount);

      // Update inventory item
      const { error: updateError } = await supabase
        .from('inventory_items')
        .update({ quantity: newQuantity })
        .eq('id', item.id);

      if (updateError) {
        throw updateError;
      }

      // Verify the update worked
      const { data: verifyData, error: verifyError } = await supabase
        .from('inventory_items')
        .select('id, name, quantity')
        .eq('id', item.id)
        .single();

      if (verifyError) {
        throw new Error('Update verification failed - could not read the item back');
      }

      if (verifyData?.quantity !== newQuantity) {
        throw new Error(`Update verification failed - expected ${newQuantity}, got ${verifyData?.quantity}`);
      }

      // Record transaction
      const { error: transactionError } = await supabase
        .from('inventory_item_transactions')
        .insert({
          item_id: item.id,
          transaction_type: adjustmentType === 'add' ? 'adjustment_increase' : 'adjustment_decrease',
          quantity: adjustmentAmount,
          previous_quantity: previousQuantity,
          new_quantity: newQuantity,
          performed_by: user.id,
          notes: notes || `Manual ${adjustmentType === 'add' ? 'addition' : 'removal'} by staff`,
        });

      if (transactionError) {
        throw transactionError;
      }

      return { previousQuantity, newQuantity, adjustmentAmount };
    },
    onSuccess: async (data) => {
      if (!data) return;
      
      toast.success(
        `Inventory ${adjustmentType === 'add' ? 'increased' : 'decreased'}`,
        {
          description: `${item?.name}: ${data.previousQuantity} → ${data.newQuantity} ${item?.unit}`,
        }
      );
      
      // Invalidate all inventory-related queries to force refresh
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-items-all'] });
      queryClient.invalidateQueries({ queryKey: ['storage-rooms'] });
      
      // Also refetch immediately to ensure UI updates
      await queryClient.refetchQueries({ queryKey: ['inventory-items'] });
      await queryClient.refetchQueries({ queryKey: ['inventory-items-all'] });
      
      handleClose();
    },
    onError: (error: Error) => {
      toast.error('Failed to adjust inventory', {
        description: error.message || 'Unknown error occurred',
      });
    },
  });

  const handleClose = () => {
    setQuantity('');
    setNotes('');
    setAdjustmentType('add');
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    adjustMutation.mutate();
  };

  if (!item) return null;

  const previewQuantity = quantity 
    ? adjustmentType === 'add'
      ? item.quantity + parseInt(quantity || '0')
      : Math.max(0, item.quantity - parseInt(quantity || '0'))
    : item.quantity;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Adjust Inventory
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Item Info */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <h3 className="font-semibold mb-1">{item.name}</h3>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>SKU: {item.sku || 'N/A'}</p>
              <p>Current Stock: <span className="font-semibold">{item.quantity} {item.unit}</span></p>
              <p>Minimum: {item.minimum_quantity} {item.unit}</p>
            </div>
          </div>

          {/* Adjustment Type */}
          <div className="space-y-2">
            <Label>Adjustment Type</Label>
            <Select value={adjustmentType} onValueChange={(value: 'add' | 'remove') => setAdjustmentType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="add">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span>Add Stock</span>
                  </div>
                </SelectItem>
                <SelectItem value="remove">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <span>Remove Stock</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
              required
            />
          </div>

          {/* Preview */}
          {quantity && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm font-medium text-blue-900">
                New Stock Level:
              </p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {item.quantity} → {previewQuantity} {item.unit}
              </p>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reason for adjustment..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={adjustMutation.isPending}>
              {adjustMutation.isPending ? 'Adjusting...' : 'Confirm Adjustment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
