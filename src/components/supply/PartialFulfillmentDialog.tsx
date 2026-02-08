import { useState } from 'react';
import { getErrorMessage } from "@/lib/errorUtils";
import { logger } from '@/lib/logger';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Loader2, 
  CheckCircle, 
  AlertTriangle, 
  Package, 
  Truck, 
  MapPin,
  XCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';

interface FulfillmentItem {
  id: string;
  item_id: string;
  quantity_requested: number;
  quantity_fulfilled: number;
  status: 'pending' | 'fulfilled' | 'partial' | 'out_of_stock';
  notes?: string;
  inventory_items?: {
    id: string;
    name: string;
    quantity: number;
    unit: string;
    sku?: string;
  };
}

interface PartialFulfillmentDialogProps {
  order: Record<string, unknown>;
  onClose: () => void;
}

export function PartialFulfillmentDialog({ order, onClose }: PartialFulfillmentDialogProps) {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  const [items, setItems] = useState<FulfillmentItem[]>(
    order.supply_request_items?.map((item: Record<string, unknown>) => ({
      id: item.id,
      item_id: item.item_id,
      quantity_requested: item.quantity_requested,
      quantity_fulfilled: item.quantity_requested,
      status: 'pending' as const,
      notes: '',
      inventory_items: item.inventory_items,
    })) || []
  );
  
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [isCompleting, setIsCompleting] = useState(false);

  const requesterName = order.profiles 
    ? `${order.profiles.first_name} ${order.profiles.last_name}`
    : 'Unknown';

  const updateItemQuantity = (itemId: string, quantity: number) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const maxQty = item.quantity_requested;
        const clampedQty = Math.max(0, Math.min(quantity, maxQty));
        return {
          ...item,
          quantity_fulfilled: clampedQty,
          status: clampedQty === 0 ? 'out_of_stock' : clampedQty < maxQty ? 'partial' : 'pending',
        };
      }
      return item;
    }));
  };

  const updateItemNotes = (itemId: string, notes: string) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, notes } : item
    ));
  };

  const markOutOfStock = (itemId: string) => {
    setItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, quantity_fulfilled: 0, status: 'out_of_stock' }
        : item
    ));
  };

  const hasPartialFulfillment = items.some(
    item => item.quantity_fulfilled < item.quantity_requested && item.quantity_fulfilled > 0
  );
  const hasOutOfStock = items.some(item => item.status === 'out_of_stock');

  const handleComplete = async () => {
    setIsCompleting(true);

    try {
      // Update each item's fulfilled quantity
      for (const item of items) {
        if (item.quantity_fulfilled > 0) {
          // Mark item as fulfilled
          await supabase
            .from('supply_request_items')
            .update({ 
              quantity_fulfilled: item.quantity_fulfilled,
              quantity_approved: item.quantity_fulfilled,
            })
            .eq('id', item.id);

          // Deduct from inventory
          await supabase.rpc('adjust_inventory_quantity', {
            p_item_id: item.item_id,
            p_quantity_change: -item.quantity_fulfilled,
            p_transaction_type: 'fulfilled',
            p_reference_id: order.id,
            p_notes: `Order #${order.id.slice(0, 8)} - ${item.quantity_fulfilled}/${item.quantity_requested} fulfilled`,
          });
        }
      }

      // Update order status
      const newStatus = hasOutOfStock || hasPartialFulfillment ? 'ready' : 'ready';
      
      await supabase
        .from('supply_requests')
        .update({
          status: newStatus,
          picking_completed_at: new Date().toISOString(),
          ready_for_delivery_at: new Date().toISOString(),
          metadata: {
            ...(order.metadata || {}),
            delivery_method: deliveryMethod,
            partial_fulfillment: hasPartialFulfillment || hasOutOfStock,
            fulfilled_by: profile?.id,
          },
        })
        .eq('id', order.id);

      toast({
        title: 'Order fulfilled',
        description: hasPartialFulfillment || hasOutOfStock
          ? 'Order partially fulfilled. Some items were unavailable.'
          : 'All items fulfilled and ready.',
      });

      queryClient.invalidateQueries({ queryKey: ['supply-staff-orders'] });
      queryClient.invalidateQueries({ queryKey: ['supply-orders'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });

      onClose();
    } catch (error) {
      logger.error('Error fulfilling order:', error);
      toast({
        title: 'Error',
        description: getErrorMessage(error) || 'Failed to fulfill order',
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
            Fulfill Order #{order.id.slice(0, 8).toUpperCase()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Order Info */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-1">
            <p className="text-sm">
              <span className="font-semibold">Requester:</span> {requesterName}
            </p>
            <p className="text-sm">
              <span className="font-semibold">Department:</span> {order.profiles?.department || 'N/A'}
            </p>
            <p className="text-sm flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span className="font-semibold">Location:</span> {order.delivery_location || 'Not specified'}
            </p>
          </div>

          <Separator />

          {/* Delivery Method */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Delivery Method</Label>
            <RadioGroup 
              value={deliveryMethod} 
              onValueChange={(v) => setDeliveryMethod(v as 'pickup' | 'delivery')}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pickup" id="pickup" />
                <Label htmlFor="pickup" className="flex items-center gap-1 cursor-pointer">
                  <Package className="h-4 w-4" />
                  Ready for Pickup
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="delivery" id="delivery" />
                <Label htmlFor="delivery" className="flex items-center gap-1 cursor-pointer">
                  <Truck className="h-4 w-4" />
                  Will Deliver
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Items List */}
          <div>
            <h3 className="font-semibold mb-3">Items to Fulfill</h3>
            <div className="space-y-3">
              {items.map((item) => {
                const currentStock = item.inventory_items?.quantity || 0;
                const isInsufficient = currentStock < item.quantity_requested;

                return (
                  <div
                    key={item.id}
                    className={`border rounded-lg p-3 space-y-2 ${
                      item.status === 'out_of_stock' 
                        ? 'bg-destructive/5 border-destructive/20' 
                        : item.status === 'partial'
                        ? 'bg-yellow-500/5 border-yellow-500/20'
                        : 'bg-card'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{item.inventory_items?.name || 'Unknown'}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            Requested: {item.quantity_requested} {item.inventory_items?.unit || 'units'}
                          </span>
                          <span className="text-xs">|</span>
                          <span className={`text-xs ${isInsufficient ? 'text-destructive' : 'text-muted-foreground'}`}>
                            In stock: {currentStock}
                          </span>
                        </div>
                      </div>
                      <Badge 
                        variant={
                          item.status === 'out_of_stock' ? 'destructive' :
                          item.status === 'partial' ? 'secondary' : 'outline'
                        }
                      >
                        {item.status === 'out_of_stock' && <XCircle className="h-3 w-3 mr-1" />}
                        {item.status === 'partial' && <AlertTriangle className="h-3 w-3 mr-1" />}
                        {item.status === 'pending' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {item.status === 'out_of_stock' ? 'Out of Stock' :
                         item.status === 'partial' ? 'Partial' : 'Full'}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs">Fulfill:</Label>
                        <Input
                          type="number"
                          min={0}
                          max={item.quantity_requested}
                          value={item.quantity_fulfilled}
                          onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 0)}
                          className="w-20 h-8"
                        />
                        <span className="text-xs text-muted-foreground">
                          / {item.quantity_requested}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-destructive"
                        onClick={() => markOutOfStock(item.id)}
                      >
                        Mark Out of Stock
                      </Button>
                    </div>

                    {(item.status === 'out_of_stock' || item.status === 'partial') && (
                      <Textarea
                        placeholder="Add a note (e.g., 'Will restock next week', 'Substituted with...')"
                        value={item.notes}
                        onChange={(e) => updateItemNotes(item.id, e.target.value)}
                        className="text-sm h-16"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Warnings */}
          {hasOutOfStock && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Some items are out of stock. The requester will be notified.
              </AlertDescription>
            </Alert>
          )}

          {hasPartialFulfillment && !hasOutOfStock && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Some items will be partially fulfilled. Consider adding notes.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isCompleting}>
            Cancel
          </Button>
          <Button onClick={handleComplete} disabled={isCompleting}>
            {isCompleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Fulfilling...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                {deliveryMethod === 'delivery' ? 'Fulfill & Deliver' : 'Mark Ready for Pickup'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
