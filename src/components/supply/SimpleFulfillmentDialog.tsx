import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertTriangle, Package } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { FulfillmentSuccessScreen } from './FulfillmentSuccessScreen';
import { useAuth } from '@/hooks/useAuth';

interface SimpleFulfillmentDialogProps {
  order: any;
  onClose: () => void;
}

interface InventoryChange {
  itemName: string;
  before: number;
  after: number;
  subtracted: number;
  unit: string;
}

export function SimpleFulfillmentDialog({ order, onClose }: SimpleFulfillmentDialogProps) {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [isCompleting, setIsCompleting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [inventoryChanges, setInventoryChanges] = useState<InventoryChange[]>([]);
  const [receiptNumber, setReceiptNumber] = useState('');

  const requesterName = order.profiles 
    ? `${order.profiles.first_name} ${order.profiles.last_name}`
    : 'Unknown';
  
  const allItemsChecked = checkedItems.size === (order.supply_request_items?.length || 0);

  const toggleItem = (itemId: string) => {
    const newSet = new Set(checkedItems);
    if (newSet.has(itemId)) {
      newSet.delete(itemId);
    } else {
      newSet.add(itemId);
    }
    setCheckedItems(newSet);
  };

  const handleComplete = async () => {
    if (!allItemsChecked) {
      toast({
        title: 'Not all items checked',
        description: 'Please check all items before completing the order.',
        variant: 'destructive',
      });
      return;
    }

    setIsCompleting(true);

    try {
      // Track inventory changes for success screen

      const changes: InventoryChange[] = [];

      // 1. Update order status to picking

      // 1. Update order status to picking
      const { error: pickingError } = await supabase
        .from('supply_requests')
        .update({
          status: 'picking',
          picking_started_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      if (pickingError) throw pickingError;

      // 2. For each item, mark as fulfilled and subtract from inventory
      for (const item of order.supply_request_items) {
        const beforeStock = item.inventory_items?.quantity || 0;
        const subtracted = item.quantity_requested;
        const afterStock = beforeStock - subtracted;

        // Track this change
        changes.push({
          itemName: item.inventory_items?.name || 'Unknown Item',
          before: beforeStock,
          after: afterStock,
          subtracted: subtracted,
          unit: item.inventory_items?.unit || 'units',
        });

        // Mark item as fulfilled
        const { error: itemError } = await supabase
          .from('supply_request_items')
          .update({ 
            quantity_fulfilled: item.quantity_requested,
            quantity_approved: item.quantity_requested 
          })
          .eq('id', item.id);

        if (itemError) throw itemError;

        // Subtract from inventory using RPC function
        const { error: invError } = await supabase.rpc('adjust_inventory_quantity', {
          p_item_id: item.item_id,
          p_quantity_change: -item.quantity_requested,
          p_transaction_type: 'fulfilled',
          p_reference_id: order.id,
          p_notes: `Order #${order.id.slice(0, 8)} fulfilled for ${requesterName}`,
        });

        if (invError) throw invError;
      }

      // Store changes for success screen
      setInventoryChanges(changes);

      // 3. Mark order as ready for pickup
      const { error: completeError } = await supabase
        .from('supply_requests')
        .update({
          status: 'ready',
          picking_completed_at: new Date().toISOString(),
          ready_for_delivery_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      if (completeError) throw completeError;

      // 4. Generate receipt
      const receiptData = {
        orderNumber: order.id.slice(0, 8).toUpperCase(),
        date: new Date().toISOString(),
        requester: requesterName,
        department: order.profiles?.department || 'N/A',
        deliveryLocation: order.delivery_location || 'Not specified',
        items: order.supply_request_items.map((item: any) => ({
          name: item.inventory_items?.name || 'Unknown Item',
          quantity: item.quantity_requested,
          unit: item.inventory_items?.unit || 'units',
        })),
      };

      const receiptNum = `RCP-${order.id.slice(0, 8).toUpperCase()}`;
      
      const { error: receiptError } = await supabase
        .from('supply_request_receipts')
        .insert({
          request_id: order.id,
          receipt_type: 'pickup',
          receipt_number: receiptNum,
          pdf_data: receiptData,
        });

      // Receipt is non-critical, don't throw if it fails

      // Store receipt number for success screen
      setReceiptNumber(receiptNum);

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['supply-orders'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });

      // Show success screen instead of just closing
      setShowSuccess(true);

    } catch (error: any) {
      console.error('Error fulfilling order:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fulfill order. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Fulfilling Order #{order.id.slice(0, 8).toUpperCase()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Order Information */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-1">
            <p className="text-sm">
              <span className="font-semibold">Ordered by:</span> {requesterName}
            </p>
            <p className="text-sm">
              <span className="font-semibold">Department:</span> {order.profiles?.department || 'N/A'}
            </p>
            <p className="text-sm">
              <span className="font-semibold">Delivery to:</span> {order.delivery_location || 'Not specified'}
            </p>
          </div>

          <Separator />

          {/* Items to Fulfill */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Items to Fulfill ({checkedItems.size}/{order.supply_request_items?.length || 0})
            </h3>

            <div className="space-y-2">
              {order.supply_request_items?.map((item: any) => {
                const isChecked = checkedItems.has(item.id);
                const currentStock = item.inventory_items?.quantity || 0;
                const afterStock = currentStock - item.quantity_requested;
                const isInsufficient = afterStock < 0;

                return (
                  <div
                    key={item.id}
                    className={`border rounded-lg p-3 transition-colors ${
                      isChecked ? 'bg-green-50 border-green-200' : 'bg-card'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => toggleItem(item.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-1">
                        <p className="font-medium">{item.inventory_items?.name || 'Unknown Item'}</p>
                        <p className="text-sm text-muted-foreground">
                          Requested: <span className="font-semibold">{item.quantity_requested}</span> {item.inventory_items?.unit || 'units'}
                        </p>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">Stock:</span>
                          <span className="font-medium">{currentStock}</span>
                          <span className="text-muted-foreground">→</span>
                          <span className={isInsufficient ? 'text-destructive font-semibold' : 'text-green-600 font-semibold'}>
                            {afterStock}
                          </span>
                          {isInsufficient ? (
                            <AlertTriangle className="h-4 w-4 text-destructive ml-1" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-green-600 ml-1" />
                          )}
                        </div>
                        {isInsufficient && (
                          <Alert variant="destructive" className="mt-2">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              Insufficient stock! Only {currentStock} available.
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Complete Button */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isCompleting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleComplete}
              disabled={!allItemsChecked || isCompleting}
              className="flex-1"
            >
              {isCompleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fulfilling Order...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark Order Ready for Pickup
                </>
              )}
            </Button>
          </div>

          {!allItemsChecked && (
            <Alert>
              <AlertDescription>
                Please check all items before completing the order.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>

      {/* Success Screen - Shows after fulfillment */}
      {showSuccess && (
        <FulfillmentSuccessScreen
          open={showSuccess}
          onClose={() => {
            setShowSuccess(false);
            onClose();
          }}
          orderNumber={order.id.slice(0, 8).toUpperCase()}
          requesterName={requesterName}
          deliveryLocation={order.delivery_location || 'Not specified'}
          inventoryChanges={inventoryChanges}
          receiptNumber={receiptNumber}
          fulfilledBy={profile?.first_name && profile?.last_name 
            ? `${profile.first_name} ${profile.last_name}` 
            : 'Supply Staff'}
          completedAt={new Date()}
        />
      )}
    </Dialog>
  );
}
