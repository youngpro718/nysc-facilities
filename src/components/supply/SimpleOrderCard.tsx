import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Package, User, MapPin, Clock, AlertTriangle, Truck, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface SimpleOrderCardProps {
  order: any;
  onFulfill: () => void;
  showDeliveryConfirm?: boolean;
  onConfirmDelivered?: () => void;
}

export function SimpleOrderCard({ 
  order, 
  onFulfill,
  showDeliveryConfirm,
  onConfirmDelivered 
}: SimpleOrderCardProps) {
  const requesterName = order.profiles 
    ? `${order.profiles.first_name} ${order.profiles.last_name}`
    : 'Unknown';
  
  const department = order.profiles?.department || 'No Department';
  const deliveryRoom = order.delivery_location || 'Not specified';
  const itemCount = order.supply_request_items?.length || 0;
  const timeAgo = formatDistanceToNow(new Date(order.created_at), { addSuffix: true });

  // Calculate if order is stuck in picking
  const pickingDuration = order.picking_started_at 
    ? (Date.now() - new Date(order.picking_started_at).getTime()) / 60000 
    : 0;
  const isStuckInPicking = order.status === 'picking' && pickingDuration > 5;

  // Check delivery method from metadata
  const deliveryMethod = order.metadata?.delivery_method || 'pickup';
  const isPartialFulfillment = order.metadata?.partial_fulfillment;
  const isReady = order.status === 'ready';
  const isCompleted = order.status === 'completed';

  // Check if order needs admin approval
  const needsApproval = order.status === 'pending_approval' || 
    order.justification?.includes('[APPROVAL REQUIRED]');

  // Determine priority badge
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

  // Status badge
  const getStatusBadge = () => {
    if (needsApproval && !isCompleted) {
      return <Badge variant="outline" className="border-orange-500 text-orange-600 bg-orange-50"><AlertTriangle className="h-3 w-3 mr-1" />Needs Approval</Badge>;
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
      return <Badge variant="outline" className="border-blue-500 text-blue-600">Picking</Badge>;
    }
    if (order.status === 'received') {
      return <Badge variant="outline" className="border-purple-500 text-purple-600">Received</Badge>;
    }
    if (order.status === 'submitted') {
      return <Badge variant="outline" className="border-blue-400 text-blue-500">New</Badge>;
    }
    if (isPartialFulfillment) {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Partial</Badge>;
    }
    return null;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order #{order.id.slice(0, 8).toUpperCase()}
          </CardTitle>
          <div className="flex items-center gap-1 flex-wrap justify-end">
            {getPriorityBadge()}
            {getStatusBadge()}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Requester Information */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{requesterName}</span>
            <span className="text-muted-foreground">({department})</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>Deliver to: <span className="font-medium">{deliveryRoom}</span></span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Requested {timeAgo}</span>
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

        {/* Items List */}
        <div className="border-t pt-3">
          <p className="text-sm font-semibold mb-2">Items Requested ({itemCount}):</p>
          <div className="space-y-1.5">
            {order.supply_request_items?.slice(0, 3).map((item: any) => {
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
                      <span className="text-yellow-600 ml-1">
                        ({fulfilled}/{requested})
                      </span>
                    ) : (
                      <span className="font-medium ml-1">Qty: {requested}</span>
                    )}
                  </span>
                </div>
              );
            })}
            {itemCount > 3 && (
              <p className="text-xs text-muted-foreground ml-6">
                +{itemCount - 3} more item{itemCount - 3 > 1 ? 's' : ''}
              </p>
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
              <Button 
                onClick={onFulfill} 
                className="w-full"
                size="lg"
              >
                <Package className="mr-2 h-4 w-4" />
                Fulfill Order
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
