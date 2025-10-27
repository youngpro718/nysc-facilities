import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Package, User, MapPin, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface SimpleOrderCardProps {
  order: any;
  onFulfill: () => void;
}

export function SimpleOrderCard({ order, onFulfill }: SimpleOrderCardProps) {
  const requesterName = order.profiles 
    ? `${order.profiles.first_name} ${order.profiles.last_name}`
    : 'Unknown';
  
  const department = order.profiles?.department || 'No Department';
  const deliveryRoom = order.delivery_location || 'Not specified';
  const itemCount = order.supply_request_items?.length || 0;
  const timeAgo = formatDistanceToNow(new Date(order.created_at), { addSuffix: true });

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

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order #{order.id.slice(0, 8).toUpperCase()}
          </CardTitle>
          {getPriorityBadge()}
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
            <span>Delivery to: <span className="font-medium">{deliveryRoom}</span></span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Requested {timeAgo}</span>
          </div>
        </div>

        {/* Items List */}
        <div className="border-t pt-3">
          <p className="text-sm font-semibold mb-2">Items Requested ({itemCount}):</p>
          <div className="space-y-1.5">
            {order.supply_request_items?.slice(0, 3).map((item: any) => (
              <div key={item.id} className="flex items-center gap-2 text-sm">
                <Checkbox disabled className="opacity-50" />
                <span>
                  {item.inventory_items?.name || 'Unknown Item'} - 
                  <span className="font-medium ml-1">Qty: {item.quantity_requested}</span>
                </span>
              </div>
            ))}
            {itemCount > 3 && (
              <p className="text-xs text-muted-foreground ml-6">
                +{itemCount - 3} more item{itemCount - 3 > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        {/* Action Button */}
        <Button 
          onClick={onFulfill} 
          className="w-full"
          size="lg"
        >
          <Package className="mr-2 h-4 w-4" />
          Start Fulfilling Order
        </Button>
      </CardContent>
    </Card>
  );
}
