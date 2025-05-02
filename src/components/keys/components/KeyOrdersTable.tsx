
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { CheckCircle, Clock, PackageCheck, X } from "lucide-react";
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

  const getStatusBadge = (status: KeyOrder['status']) => {
    switch (status) {
      case 'ordered':
        return <Badge variant="outline" className="flex items-center gap-1"><Clock className="h-3 w-3" /> Ordered</Badge>;
      case 'partially_received':
        return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="h-3 w-3" /> Partial</Badge>;
      case 'received':
        return <Badge variant="default" className="flex items-center gap-1 bg-green-500"><CheckCircle className="h-3 w-3" /> Received</Badge>;
      case 'canceled':
        return <Badge variant="destructive" className="flex items-center gap-1"><X className="h-3 w-3" /> Canceled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
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
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell>
                <div className="font-medium">{order.key_name}</div>
                <div className="text-xs text-muted-foreground">{order.key_type}</div>
              </TableCell>
              <TableCell>{order.quantity}</TableCell>
              <TableCell>{format(new Date(order.ordered_at), "MMM d, yyyy")}</TableCell>
              <TableCell>
                {order.expected_delivery_date 
                  ? format(new Date(order.expected_delivery_date), "MMM d, yyyy") 
                  : "Not specified"}
              </TableCell>
              <TableCell>{getStatusBadge(order.status)}</TableCell>
              <TableCell>
                {order.recipient_name 
                  ? <div>{order.recipient_name}<div className="text-xs text-muted-foreground">{order.recipient_department}</div></div> 
                  : "General inventory"}
              </TableCell>
              <TableCell>
                {(order.status === 'ordered' || order.status === 'partially_received') && (
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex items-center gap-1"
                      onClick={() => onReceiveKeys(order)}
                    >
                      <PackageCheck className="h-4 w-4" />
                      Receive
                    </Button>
                    
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-destructive hover:text-destructive"
                      onClick={() => onCancelOrder(order.id)}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
                
                {(order.status === 'received' || order.status === 'canceled') && (
                  <span className="text-sm text-muted-foreground">
                    {order.status === 'received' && order.received_at 
                      ? `Completed on ${format(new Date(order.received_at), "MMM d, yyyy")}` 
                      : "No actions available"}
                  </span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
