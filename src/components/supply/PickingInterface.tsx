import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, Loader2, MapPin, Package, XCircle, AlertCircle } from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { useGenerateReceipt } from '@/hooks/useSupplyReceipts';
import { createReceiptData } from '@/lib/receiptUtils';
import { useStockAlert } from '@/hooks/useStockAlert';

interface PickingInterfaceProps {
  request: any;
  onComplete: () => void;
  onCancel: () => void;
}

interface PickedItem {
  itemId: string;
  picked: boolean;
  quantityPicked: number;
}

export function PickingInterface({ request, onComplete, onCancel }: PickingInterfaceProps) {
  const queryClient = useQueryClient();
  const { mutateAsync: generateReceipt } = useGenerateReceipt();
  const { reportOutOfStock, reportLowStock, isAlertPending } = useStockAlert();
  
  const [pickedItems, setPickedItems] = useState<Record<string, PickedItem>>({});

  // Fetch current inventory levels
  const { data: inventoryLevels } = useQuery({
    queryKey: ['inventory-levels', request.id],
    queryFn: async () => {
      const itemIds = request.supply_request_items?.map((item: any) => item.item_id) || [];
      const { data, error } = await supabase
        .from('inventory_items')
        .select('id, quantity')
        .in('id', itemIds);
      
      if (error) throw error;
      return data.reduce((acc: any, item: any) => {
        acc[item.id] = item.quantity;
        return acc;
      }, {});
    },
    enabled: !!request.supply_request_items?.length,
  });

  // Initialize picked items state
  useEffect(() => {
    if (request.supply_request_items) {
      const initial: Record<string, PickedItem> = {};
      request.supply_request_items.forEach((item: any) => {
        initial[item.item_id] = {
          itemId: item.item_id,
          picked: false,
          quantityPicked: item.quantity_requested,
        };
      });
      setPickedItems(initial);
    }
  }, [request]);

  const markReadyMutation = useMutation({
    mutationFn: async () => {
      // 1. Update status to 'ready' and record picking completion
      const { error: updateError } = await supabase
        .from('supply_requests')
        .update({
          status: 'ready',
          picking_completed_at: new Date().toISOString(),
          ready_for_delivery_at: new Date().toISOString(),
        })
        .eq('id', request.id);

      if (updateError) throw updateError;

      // 2. Update item quantities picked
      for (const [itemId, pickedData] of Object.entries(pickedItems)) {
        const { error: itemError } = await supabase
          .from('supply_request_items')
          .update({ quantity_fulfilled: pickedData.quantityPicked })
          .eq('request_id', request.id)
          .eq('item_id', itemId);

        if (itemError) throw itemError;

        // 3. DEDUCT INVENTORY via transaction (trigger will update inventory_items)
        if (pickedData.quantityPicked > 0) {
          const currentStock = inventoryLevels?.[itemId] || 0;
          
          const { error: invError } = await supabase
            .from('inventory_item_transactions')
            .insert({
              item_id: itemId,
              transaction_type: 'fulfilled',
              quantity: pickedData.quantityPicked,
              previous_quantity: currentStock,
              new_quantity: currentStock - pickedData.quantityPicked,
              notes: `Order #${request.id.slice(0, 8)} ready for pickup: ${request.title}`,
            });

          if (invError) throw invError;
          // Trigger automatically deducts from inventory_items
        }
      }

      // 4. Fetch updated request for receipt
      const { data: updatedRequest } = await supabase
        .from('supply_requests')
        .select(`
          *,
          profiles!requester_id (
            first_name,
            last_name,
            email,
            department
          ),
          supply_request_items (
            *,
            inventory_items (
              name,
              unit
            )
          )
        `)
        .eq('id', request.id)
        .single();

      // 5. Generate pickup receipt
      if (updatedRequest) {
        try {
          const receiptData = createReceiptData(updatedRequest, 'pickup', '');
          await generateReceipt({
            requestId: request.id,
            receiptType: 'pickup',
            receiptData,
          });
        } catch (receiptError) {
          console.error('Failed to generate pickup receipt:', receiptError);
        }
      }
    },
    onSuccess: () => {
      toast({
        title: 'Order Ready',
        description: 'Order marked as ready for pickup. Inventory has been deducted.',
      });
      queryClient.invalidateQueries({ queryKey: ['supply-requests'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      onComplete();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to mark order as ready',
        variant: 'destructive',
      });
    },
  });

  const togglePicked = (itemId: string) => {
    setPickedItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        picked: !prev[itemId].picked,
      },
    }));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    setPickedItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        quantityPicked: Math.max(0, quantity),
      },
    }));
  };

  const totalItems = request.supply_request_items?.length || 0;
  const pickedCount = Object.values(pickedItems).filter(item => item.picked).length;
  const progress = totalItems > 0 ? (pickedCount / totalItems) * 100 : 0;

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Picking Order: {request.title}
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          {request.profiles?.first_name} {request.profiles?.last_name}
          {request.profiles?.department && ` • ${request.profiles.department}`}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Picking Progress</span>
            <span className="text-muted-foreground">
              {pickedCount} of {totalItems} items
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Items Checklist */}
        <div className="space-y-3">
          {request.supply_request_items?.map((item: any) => {
            const currentStock = inventoryLevels?.[item.item_id] || 0;
            const pickedQty = pickedItems[item.item_id]?.quantityPicked || 0;
            const afterStock = currentStock - pickedQty;
            const isInsufficient = afterStock < 0;
            const isPicked = pickedItems[item.item_id]?.picked || false;

            return (
              <div
                key={item.id}
                className={`border rounded-lg p-4 space-y-3 transition-colors ${
                  isPicked ? 'bg-success/5 border-success/30' : 'bg-card'
                }`}
              >
                {/* Item Header */}
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={isPicked}
                    onCheckedChange={() => togglePicked(item.item_id)}
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="font-medium">{item.inventory_items?.name}</div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{item.inventory_items?.location_details || 'No location specified'}</span>
                    </div>
                  </div>
                </div>

                {/* Quantity Input */}
                <div className="flex items-center gap-3 ml-7">
                  <Label className="text-sm whitespace-nowrap">Picked:</Label>
                  <Input
                    type="number"
                    min="0"
                    max={item.quantity_requested}
                    value={pickedQty}
                    onChange={(e) => updateQuantity(item.item_id, parseInt(e.target.value) || 0)}
                    className="w-24 h-9"
                  />
                  <span className="text-sm text-muted-foreground">
                    / {item.quantity_requested} {item.inventory_items?.unit || 'units'}
                  </span>
                </div>

                {/* Stock Info */}
                <div className="ml-7">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Stock:</span>
                    <span className="font-medium">{currentStock}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className={isInsufficient ? 'text-destructive font-semibold' : 'text-success'}>
                      {afterStock}
                    </span>
                    {isInsufficient ? (
                      <Badge variant="destructive" className="ml-2">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Insufficient Stock
                      </Badge>
                    ) : (
                      <CheckCircle className="h-4 w-4 text-success ml-2" />
                    )}
                  </div>
                </div>

                {/* Warning for insufficient stock */}
                {isInsufficient && (
                  <Alert variant="destructive" className="ml-7">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Only {currentStock} {item.inventory_items?.unit || 'units'} available. Adjust picked quantity.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Quick Stock Alert Buttons - NEW */}
                <div className="ml-7 flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive border-destructive/50 hover:bg-destructive/10"
                    disabled={isAlertPending}
                    onClick={() => {
                      updateQuantity(item.item_id, 0);
                      reportOutOfStock({
                        itemId: item.item_id,
                        itemName: item.inventory_items?.name || 'Unknown item',
                        requestId: request.id,
                        currentStock,
                      });
                    }}
                  >
                    <XCircle className="h-3 w-3 mr-1" />
                    Out of Stock
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-amber-600 border-amber-500/50 hover:bg-amber-500/10"
                    disabled={isAlertPending}
                    onClick={() => {
                      reportLowStock({
                        itemId: item.item_id,
                        itemName: item.inventory_items?.name || 'Unknown item',
                        requestId: request.id,
                        currentStock,
                      });
                    }}
                  >
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Low Stock
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={markReadyMutation.isPending}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={() => markReadyMutation.mutate()}
            disabled={markReadyMutation.isPending || pickedCount === 0}
            className="flex-1"
          >
            {markReadyMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Ready for Pickup
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
