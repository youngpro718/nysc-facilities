import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Package, CheckCircle, Truck, AlertTriangle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface OrderTableViewProps {
  orders: unknown[];
  onFulfill: (order: Record<string, unknown>) => void;
  onConfirmPickup?: (orderId: string) => void;
  isConfirmingPickup?: boolean;
}

export function OrderTableView({ 
  orders, 
  onFulfill, 
  onConfirmPickup,
  isConfirmingPickup = false 
}: OrderTableViewProps) {
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive">Urgent</Badge>;
      case 'high':
        return <Badge variant="secondary">High</Badge>;
      default:
        return <Badge variant="outline">Normal</Badge>;
    }
  };

  const getStatusBadge = (order: Record<string, unknown>) => {
    const isCompleted = order.status === 'completed';
    const isReady = order.status === 'ready';
    const deliveryMethod = order.metadata?.delivery_method || 'pickup';
    const needsApproval = order.status === 'pending_approval';

    if (needsApproval && !isCompleted) {
      return <Badge variant="outline" className="border-orange-500 text-orange-600 bg-orange-50">Needs Approval</Badge>;
    }
    if (isCompleted) {
      return <Badge className="bg-green-600">Completed</Badge>;
    }
    if (isReady) {
      if (deliveryMethod === 'delivery') {
        return <Badge className="bg-blue-600">For Delivery</Badge>;
      }
      return <Badge variant="secondary">Ready</Badge>;
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
    return <Badge variant="outline">{order.status}</Badge>;
  };

  const getActionButton = (order: Record<string, unknown>) => {
    const isCompleted = order.status === 'completed';
    const isReady = order.status === 'ready';
    const deliveryMethod = order.metadata?.delivery_method || 'pickup';

    if (isCompleted) {
      return null;
    }

    if (isReady && deliveryMethod !== 'delivery' && onConfirmPickup) {
      return (
        <Button 
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onConfirmPickup(order.id);
          }}
          className="bg-green-600 hover:bg-green-700"
          disabled={isConfirmingPickup}
        >
          <CheckCircle className="mr-1 h-3 w-3" />
          Confirm Pickup
        </Button>
      );
    }

    if (isReady) {
      return (
        <Button 
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            onFulfill(order);
          }}
        >
          View
        </Button>
      );
    }

    return (
      <Button 
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          onFulfill(order);
        }}
      >
        <Package className="mr-1 h-3 w-3" />
        Fulfill
      </Button>
    );
  };

  if (orders.length === 0) {
    return null;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order #</TableHead>
            <TableHead>Requester</TableHead>
            <TableHead className="hidden md:table-cell">Department</TableHead>
            <TableHead className="hidden lg:table-cell">Location</TableHead>
            <TableHead className="hidden sm:table-cell">Items</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden md:table-cell">Time</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const requesterName = order.profiles 
              ? `${order.profiles.first_name} ${order.profiles.last_name}`
              : 'Unknown';
            const department = order.profiles?.department || 'N/A';
            const location = order.delivery_location || 'Not specified';
            const itemCount = order.supply_request_items?.length || 0;
            const timeAgo = formatDistanceToNow(new Date(order.created_at), { addSuffix: false });

            return (
              <TableRow 
                key={order.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onFulfill(order)}
              >
                <TableCell className="font-mono text-sm">
                  {order.id.slice(0, 8).toUpperCase()}
                </TableCell>
                <TableCell className="font-medium">{requesterName}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">
                  {department}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-muted-foreground">
                  {location}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge variant="outline">{itemCount} item{itemCount !== 1 ? 's' : ''}</Badge>
                </TableCell>
                <TableCell>{getPriorityBadge(order.priority)}</TableCell>
                <TableCell>{getStatusBadge(order)}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {timeAgo}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {getActionButton(order)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
