import { useEffect, useMemo, useState } from 'react';
import { getErrorMessage } from "@/lib/errorUtils";
import { logger } from '@/lib/logger';
import { DialogFooter } from '@/components/ui/dialog';
import { ModalFrame } from '@shared/components/common/common/ModalFrame';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { formatRequestId } from '@/lib/requestIds';
import { toast } from '@shared/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@features/auth/hooks/useAuth';

interface FulfillmentItem {
  id: string;
  item_id: string;
  quantity_requested: number;
  quantity_fulfilled: number;
  status: 'pending' | 'fulfilled' | 'partial' | 'out_of_stock';
  notes?: string;
  /** Which room's inventory row to deduct from (defaults to the ordered row). */
  source_item_id: string;
  inventory_items?: {
    id: string;
    name: string;
    quantity: number;
    unit: string;
    sku?: string;
  };
}

/** One room's stock for a catalog listing (the listing itself or a row linked under it). */
interface StockSource {
  id: string;
  quantity: number;
  roomLabel: string;
  condition: string;
}

interface PartialFulfillmentDialogProps {
  order: any;
  onClose: () => void;
  readOnly?: boolean;
}

export function PartialFulfillmentDialog({ order, onClose, readOnly = false }: PartialFulfillmentDialogProps) {
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
      source_item_id: item.item_id,
      inventory_items: item.inventory_items,
    })) || []
  );

  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [isCompleting, setIsCompleting] = useState(false);

  // A catalog listing can hold stock in several rooms (inventory rows linked
  // via catalog_item_id, migration 103). Fetch every room's row for the
  // ordered items so staff can pick which room to pull from.
  const orderedInventoryIds = useMemo(
    () =>
      Array.from(
        new Set(
          (order.supply_request_items || [])
            .map((it: Record<string, unknown>) => it.item_id as string)
            .filter(Boolean),
        ),
      ),
    [order.supply_request_items],
  );

  const { data: stockSourcesByItem } = useQuery({
    queryKey: ['fulfillment-stock-sources', order.id],
    enabled: orderedInventoryIds.length > 0 && !readOnly,
    queryFn: async (): Promise<Record<string, StockSource[]>> => {
      const idList = orderedInventoryIds.join(',');
      const { data: rows, error } = await supabase
        .from('inventory_items')
        .select('id, quantity, status, storage_room_id, catalog_item_id, condition')
        .or(`id.in.(${idList}),catalog_item_id.in.(${idList})`);
      if (error) throw error;

      const roomIds = Array.from(
        new Set((rows || []).map((r) => r.storage_room_id).filter(Boolean)),
      ) as string[];
      const roomsById = new Map<string, { name: string | null; room_number: string | null }>();
      if (roomIds.length > 0) {
        const { data: rooms, error: roomsError } = await supabase
          .from('rooms')
          .select('id, name, room_number')
          .in('id', roomIds);
        if (roomsError) throw roomsError;
        for (const r of rooms || []) roomsById.set(r.id, r);
      }

      const bySource: Record<string, StockSource[]> = {};
      for (const row of rows || []) {
        if (row.status && row.status !== 'active') continue;
        const listingId = (row.catalog_item_id as string | null) ?? row.id;
        if (!orderedInventoryIds.includes(listingId) && !orderedInventoryIds.includes(row.id)) continue;
        const room = row.storage_room_id ? roomsById.get(row.storage_room_id) : undefined;
        const condition = row.condition === 'used' ? 'used' : 'new';
        const baseLabel = room
          ? room.name && room.name !== room.room_number
            ? `Room ${room.room_number} — ${room.name}`
            : `Room ${room.room_number}`
          : 'No room set';
        const key = orderedInventoryIds.includes(listingId) ? listingId : row.id;
        (bySource[key] ||= []).push({
          id: row.id,
          quantity: row.quantity ?? 0,
          roomLabel: baseLabel,
          condition,
        });
      }
      for (const list of Object.values(bySource)) {
        list.sort((a, b) => b.quantity - a.quantity);
      }
      return bySource;
    },
  });

  // When room stock loads, default each line to a room that can actually
  // cover it: keep the ordered row if it has the most stock, otherwise the
  // fullest room in the group.
  useEffect(() => {
    if (!stockSourcesByItem) return;
    setItems((prev) =>
      prev.map((item) => {
        const sources = stockSourcesByItem[item.item_id];
        if (!sources || sources.length < 2) return item;
        const current = sources.find((s) => s.id === item.source_item_id);
        if (current && current.quantity >= item.quantity_requested) return item;
        return { ...item, source_item_id: sources[0].id };
      }),
    );
  }, [stockSourcesByItem]);

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

  const updateItemSource = (itemId: string, sourceItemId: string) => {
    setItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, source_item_id: sourceItemId } : item
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
    if (readOnly) return;
    setIsCompleting(true);

    try {
      // Atomically fulfill: deducts inventory, records transactions, updates
      // line items, and transitions the request to 'ready' in one server-side
      // transaction (see db/migrations/096_fix_supply_fulfillment.sql).
      const { error } = await supabase.rpc('fulfill_supply_request', {
        p_request_id: order.id,
        p_items: items.map((item) => ({
          item_id: item.id,
          quantity_fulfilled: item.quantity_fulfilled,
          // Deduct from the room the stock was pulled from (same catalog
          // group as the ordered item; validated server-side).
          source_item_id: item.source_item_id,
          notes: item.notes || `Order #${formatRequestId(order.id, order.display_id)} - ${item.quantity_fulfilled}/${item.quantity_requested} fulfilled`,
        })),
        p_delivery_method: deliveryMethod,
      });

      if (error) throw error;

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
    <ModalFrame
      open
      onOpenChange={onClose}
      size="lg"
      title={
        <span className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          {readOnly ? 'Order Details' : 'Fulfill Order'} #{formatRequestId(order.id, order.display_id)}
        </span>
      }
    >
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

          {readOnly && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Awaiting supervisor approval. Fulfillment controls will be available after approval.
              </AlertDescription>
            </Alert>
          )}

          <Separator />

          {/* Delivery Method */}
          {!readOnly && <div className="space-y-2">
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
          </div>}

          {!readOnly && <Separator />}

          {/* Items List */}
          <div>
            <h3 className="font-semibold mb-3">{readOnly ? 'Requested Items' : 'Items to Fulfill'}</h3>
            <div className="space-y-3">
              {items.map((item) => {
                const sources = stockSourcesByItem?.[item.item_id] || [];
                const selectedSource = sources.find((s) => s.id === item.source_item_id);
                const currentStock = selectedSource?.quantity ?? item.inventory_items?.quantity ?? 0;
                const isInsufficient = currentStock < item.quantity_requested;
                // Only worth surfacing when stock is actually split new/used —
                // most items (pens, paper, etc.) never have a "used" row, so
                // showing "(New)" everywhere would just be noise.
                const hasConditionSplit = sources.some((s) => s.condition === 'used');

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
                          {!readOnly && <span className="text-xs">|</span>}
                          {!readOnly && <span className={`text-xs ${isInsufficient ? 'text-destructive' : 'text-muted-foreground'}`}>
                            In stock: {currentStock}
                            {selectedSource && (() => {
                              const parts = [
                                ...(hasConditionSplit ? [selectedSource.condition === 'used' ? 'Used' : 'New'] : []),
                                ...(sources.length > 1 ? [selectedSource.roomLabel] : []),
                              ];
                              return parts.length > 0 ? ` (${parts.join(' — ')})` : '';
                            })()}
                          </span>}
                        </div>
                      </div>
                      {!readOnly && <Badge
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
                      </Badge>}
                    </div>

                    {!readOnly && <div className="flex items-center gap-3">
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
                    </div>}

                    {!readOnly && sources.length > 1 && (
                      <div className="flex items-center gap-2">
                        <Label className="text-xs whitespace-nowrap">Pull from:</Label>
                        <Select
                          value={item.source_item_id}
                          onValueChange={(value) => updateItemSource(item.id, value)}
                        >
                          <SelectTrigger className="h-8 text-xs" aria-label="Room to pull stock from">
                            <SelectValue placeholder="Select room" />
                          </SelectTrigger>
                          <SelectContent>
                            {sources.map((source) => (
                              <SelectItem key={source.id} value={source.id}>
                                {source.roomLabel}{hasConditionSplit ? ` · ${source.condition === 'used' ? 'Used' : 'New'}` : ''} · {source.quantity} in stock
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {!readOnly && (item.status === 'out_of_stock' || item.status === 'partial') && (
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
          {!readOnly && hasOutOfStock && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Some items are out of stock. The requester will be notified.
              </AlertDescription>
            </Alert>
          )}

          {!readOnly && hasPartialFulfillment && !hasOutOfStock && (
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
            {readOnly ? 'Close' : 'Cancel'}
          </Button>
          {!readOnly && <Button onClick={handleComplete} disabled={isCompleting}>
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
          </Button>}
        </DialogFooter>
    </ModalFrame>
  );
}
