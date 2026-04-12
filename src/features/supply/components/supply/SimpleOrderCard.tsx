import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Package, User, MapPin, Clock, AlertTriangle, Truck, CheckCircle, ChevronDown, ChevronUp, Flame, Loader2 } from 'lucide-react';
import { formatDistanceToNow, formatDistanceToNowStrict } from 'date-fns';
import { cn } from '@/lib/utils';
import { OrderETABadge } from './OrderETABadge';

interface SimpleOrderCardProps {
  order: any;
  onFulfill: () => void;
  onConfirmPickup?: () => void;
  showDeliveryConfirm?: boolean;
  onConfirmDelivered?: () => void;
  isConfirmingPickup?: boolean;
  onQuickReady?: (orderId: string) => void;
  isQuickReadying?: boolean;
  urgencyClass?: string;
}

export function SimpleOrderCard({ 
  order, 
  onFulfill,
  onConfirmPickup,
  showDeliveryConfirm,
  onConfirmDelivered,
  isConfirmingPickup = false,
  onQuickReady,
  isQuickReadying = false,
  urgencyClass = '',
}: SimpleOrderCardProps) {
  const [showAllItems, setShowAllItems] = useState(false);

  const requesterName = order.profiles 
    ? `${order.profiles.first_name} ${order.profiles.last_name}`
    : 'Unknown';
  
  const department = order.profiles?.department || 'No Department';
  const deliveryRoom = order.delivery_location || 'Not specified';
  const itemCount = order.supply_request_items?.length || 0;
  const timeAgo = formatDistanceToNow(new Date(order.created_at), { addSuffix: true });
  const waitTime = formatDistanceToNowStrict(new Date(order.created_at));

  // Calculate if order is stuck in picking
  const pickingDuration = order.picking_started_at 
    ? (Date.now() - new Date(order.picking_started_at).getTime()) / 60000 
    : 0;
  const isStuckInPicking = order.status === 'picking' && pickingDuration > 5;

  // Urgency based on wait time
  const minutesWaiting = (Date.now() - new Date(order.created_at).getTime()) / 60000;
  const isUrgentWait = minutesWaiting > 60;
  const isWarningWait = minutesWaiting > 30;

  // Check delivery method from metadata
  const deliveryMethod = order.metadata?.delivery_method || 'pickup';
  const isPartialFulfillment = order.metadata?.partial_fulfillment;
  const isReady = order.status === 'ready';
  const isCompleted = order.status === 'completed';

  // Check if order needs admin approval
  const needsApproval = order.status === 'pending_approval' || 
    order.justification?.includes('[APPROVAL REQUIRED]');

  const getPriorityBadge = () => {
    switch (order.priority) {
      case 'urgent':
        return <Badge variant="destructive">🔴 URGENT</Badge>;
      case 'high':
        return <Badge variant="secondary">🟡 HIGH</Badge>;
      default:
        return null;
    }
  };

  const getStatusBadge = () => {
    if (needsApproval && !isCompleted) {
      return <Badge variant="outline" className="border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30"><AlertTriangle className="h-3 w-3 mr-1" />Needs Approval</Badge>;
    }
    if (isCompleted) {
      return <Badge className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
    }
    if (isReady) {
      if (deliveryMethod === 'delivery') {
        return <Badge className="bg-blue-600"><Truck className="h-3 w-3 mr-1" />For Delivery</Badge>;
      }
      return <Badge variant="secondary"><Package className="h-3 w-3 mr-1" />Ready for Pickup</Badge>;
    }
    if (order.status === 'picking') {
      return <Badge variant="outline" className="border-blue-500 text-blue-600 dark:text-blue-400">Picking</Badge>;
    }
    if (order.status === 'received') {
      return <Badge variant="outline" className="border-purple-500 text-purple-600 dark:text-purple-400">Received</Badge>;
    }
    if (order.status === 'submitted') {
      return <Badge variant="outline" className="border-blue-400 text-blue-500">New</Badge>;
    }
    if (isPartialFulfillment) {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-600 dark:text-yellow-400">Partial</Badge>;
    }
    return null;
  };

  const displayedItems = showAllItems 
    ? order.supply_request_items 
    : order.supply_request_items?.slice(0, 3);

  return (
    <Card className={cn('hover:shadow-md transition-all', urgencyClass)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order #{(order.id as string).slice(0, 8).toUpperCase()}
          </CardTitle>
          <div className="flex items-center gap-1 flex-wrap justify-end">
            {getPriorityBadge()}
            {getStatusBadge()}
            <OrderETABadge order={order} />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Requester + Time in Queue */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{requesterName}</span>
            <span className="text-muted-foreground">({department})</span>
          </div>
          
          {/* Delivery location - prominent */}
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <Badge variant="outline" className="font-semibold text-sm px-2.5 py-0.5">
              {deliveryRoom}
            </Badge>
          </div>
          
          {/* Time in queue with urgency coloring */}
          <div className={cn(
            'flex items-center gap-2 text-sm',
            isUrgentWait ? 'text-destructive font-medium' : isWarningWait ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'
          )}>
            {isUrgentWait ? (
              <Flame className="h-4 w-4" />
            ) : (
              <Clock className="h-4 w-4" />
            )}
            <span>
              {isUrgentWait ? `⚠ Waiting ${waitTime}` : `Requested ${timeAgo}`}
            </span>
          </div>
        </div>

        {/* Stuck in Picking Warning */}
        {isStuckInPicking && (
          <Alert variant="destructive" className="border-yellow-500 bg-yellow-500/10">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              This order has been in picking status for {Math.round(pickingDuration)} minutes. 
              Don't forget to mark it ready when done!
            </AlertDescription>
          </Alert>
        )}

        {/* Items List - Expandable */}
        <div className="border-t pt-3">
          <p className="text-sm font-semibold mb-2">Items Requested ({itemCount}):</p>
          {order.supply_request_items?.some((item: any) =>
            (item.inventory_items?.quantity ?? 0) < item.quantity_requested
          ) && (
            <div className="flex items-center gap-1.5 text-xs text-amber-600 mb-2">
              <AlertTriangle className="h-3 w-3" />
              <span>Some items may have insufficient stock</span>
            </div>
          )}
          <div className="space-y-1.5">
            {displayedItems?.map((item: any) => {
              const fulfilled = item.quantity_fulfilled || 0;
              const requested = item.quantity_requested;
              const isPartial = fulfilled > 0 && fulfilled < requested;
              const isUnfulfilled = fulfilled === 0 && isReady;

              return (
                <div key={item.id} className="flex items-center gap-2 text-sm">
                  <Checkbox disabled checked={fulfilled >= requested} className="opacity-50" />
                  <span className={isUnfulfilled ? 'line-through text-muted-foreground' : ''}>
                    {item.inventory_items?.name || 'Unknown Item'}
                    {isPartial ? (
                      <span className="text-yellow-600 dark:text-yellow-400 ml-1">
                        ({fulfilled}/{requested})
                      </span>
                    ) : (
                      <span className="font-medium ml-1">Qty: {requested}</span>
                    )}
                    {' '}
                    <span className={cn(
                      "text-xs",
                      item.inventory_items?.quantity === 0
                        ? "text-red-500 font-medium"
                        : item.inventory_items?.quantity <= item.quantity_requested
                          ? "text-amber-500"
                          : "text-muted-foreground"
                    )}>
                      ({item.inventory_items?.quantity ?? '?'} in stock)
                    </span>
                  </span>
                </div>
              );
            })}
            {itemCount > 3 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7 px-2 text-muted-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAllItems(!showAllItems);
                }}
              >
                {showAllItems ? (
                  <><ChevronUp className="h-3 w-3 mr-1" />Show less</>
                ) : (
                  <><ChevronDown className="h-3 w-3 mr-1" />+{itemCount - 3} more item{itemCount - 3 > 1 ? 's' : ''}</>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {!isCompleted && (
          <div className="flex gap-2">
            {isReady && deliveryMethod === 'delivery' && showDeliveryConfirm ? (
              <Button 
                onClick={onConfirmDelivered} 
                className="w-full"
                size="lg"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark as Delivered
              </Button>
            ) : isReady && deliveryMethod !== 'delivery' && onConfirmPickup ? (
              <Button 
                onClick={onConfirmPickup}
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
                disabled={isConfirmingPickup}
              >
                {isConfirmingPickup ? (
                  <>
                    <Package className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Confirm Picked Up
                  </>
                )}
              </Button>
            ) : isReady ? (
              <Button 
                onClick={onFulfill} 
                variant="outline"
                className="w-full"
                size="lg"
              >
                <Package className="mr-2 h-4 w-4" />
                View Order
              </Button>
            ) : (
              <>
                <Button
                  onClick={onFulfill}
                  className={onQuickReady ? "flex-1" : "w-full"}
                  size="lg"
                >
                  <Package className="mr-2 h-4 w-4" />
                  Fulfill Order
                </Button>
                {onQuickReady && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuickReady(order.id);
                    }}
                    disabled={isQuickReadying}
                    className="text-green-600 border-green-200 hover:bg-green-50"
                  >
                    {isQuickReadying ? (
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-1.5" />
                    )}
                    Quick Ready
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
