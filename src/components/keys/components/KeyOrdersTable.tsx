
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { CheckCircle, Clock, PackageCheck, X, Package } from "lucide-react";
import { KeyOrder } from "../types/OrderTypes";

interface KeyOrdersTableProps {
  orders: KeyOrder[];
  isLoading: boolean;
  onReceiveKeys: (order: KeyOrder) => void;
  onCancelOrder: (orderId: string) => void;
}

export function KeyOrdersTable({ orders, isLoading, onReceiveKeys, onCancelOrder }: KeyOrdersTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Key</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Ordered On</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(3)].map((_, i) => (
              <TableRow key={i}>
                <TableCell className="animate-pulse bg-muted h-6 w-24 rounded"></TableCell>
                <TableCell className="animate-pulse bg-muted h-6 w-12 rounded"></TableCell>
                <TableCell className="animate-pulse bg-muted h-6 w-24 rounded"></TableCell>
                <TableCell className="animate-pulse bg-muted h-6 w-20 rounded"></TableCell>
                <TableCell className="animate-pulse bg-muted h-6 w-32 rounded"></TableCell>
                <TableCell className="animate-pulse bg-muted h-6 w-32 rounded"></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-10 border rounded-md">
        <h3 className="font-medium">No key orders found</h3>
        <p className="text-muted-foreground">Create a new order to get started</p>
      </div>
    );
  }

  const normalizeStatus = (status: string): KeyOrder['status'] => {
    switch (status) {
      case 'ordered':
      case 'in_transit':
        return 'in_progress';
      case 'delivered':
        return 'completed';
      case 'partially_received':
        return 'received' as any;
      default:
        return status as any;
    }
  };

  const getStatusBadge = (status: KeyOrder['status']) => {
    switch (status) {
      case 'pending_fulfillment':
        return <Badge variant="outline" className="flex items-center gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
      case 'in_progress':
        return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="h-3 w-3" /> In Progress</Badge>;
      case 'received':
        return <Badge variant="secondary" className="flex items-center gap-1"><Package className="h-3 w-3" /> Received</Badge>;
      case 'ready_for_pickup':
        return <Badge variant="default" className="flex items-center gap-1 bg-green-500"><CheckCircle className="h-3 w-3" /> Ready</Badge>;
      case 'completed':
        return <Badge variant="default" className="flex items-center gap-1 bg-green-500"><CheckCircle className="h-3 w-3" /> Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive" className="flex items-center gap-1"><X className="h-3 w-3" /> Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table className="min-w-max">
        <TableHeader>
          <TableRow>
            <TableHead>Key</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Ordered On</TableHead>
            <TableHead>Expected</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Recipient</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const normalized = normalizeStatus(order.status as any);
            const profile = (order as any)?.key_requests?.profiles;
            const userName = ((profile?.first_name || '') || (profile?.last_name || ''))
              ? `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim()
              : profile?.email || 'Unknown User';
            const orderedDateStr = (order as any).ordered_at || (order as any).created_at;
            return (
            <TableRow key={order.id}>
              <TableCell>
                <div className="font-medium">{(order as any).keys?.name || (order as any).key_name || 'Unknown Key'}</div>
                <div className="text-xs text-muted-foreground">{(order as any).keys?.type || (order as any).key_type || 'Standard'}</div>
              </TableCell>
              <TableCell>{order.quantity}</TableCell>
              <TableCell>{orderedDateStr ? format(new Date(orderedDateStr), "MMM d, yyyy") : 'N/A'}</TableCell>
              <TableCell>
                {order.expected_delivery_date 
                  ? format(new Date(order.expected_delivery_date), "MMM d, yyyy") 
                  : "Not specified"}
              </TableCell>
              <TableCell>{getStatusBadge(normalized)}</TableCell>
              <TableCell>
                {profile 
                  ? (
                    <div>
                      {userName}
                      {profile?.email && (
                        <div className="text-xs text-muted-foreground">{profile.email}</div>
                      )}
                    </div>
                  ) : (order as any).recipient_name ? (
                    <div>
                      {(order as any).recipient_name}
                      {(order as any).recipient_department && (
                        <div className="text-xs text-muted-foreground">{(order as any).recipient_department}</div>
                      )}
                    </div>
                  ) : (
                    "General inventory"
                  )}
              </TableCell>
              <TableCell>
                {(normalized === 'pending_fulfillment' || normalized === 'in_progress') && (
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex items-center gap-1 h-11"
                      onClick={() => onReceiveKeys(order)}
                    >
                      <PackageCheck className="h-4 w-4" />
                      Receive
                    </Button>
                    
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-destructive hover:text-destructive h-11"
                      onClick={() => onCancelOrder(order.id)}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
                
                {(normalized === 'completed' || normalized === 'cancelled') && (
                  <span className="text-sm text-muted-foreground">
                    {normalized === 'completed' && (order as any).received_at 
                      ? `Completed on ${format(new Date((order as any).received_at), "MMM d, yyyy")}` 
                      : "No actions available"}
                  </span>
                )}
              </TableCell>
            </TableRow>
          )})}
        </TableBody>
      </Table>
    </div>
  );
}
