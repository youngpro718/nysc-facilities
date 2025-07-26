import { useState } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, Clock, X, ArrowRight } from "lucide-react";
import { ReceiveKeysDialog } from "../dialogs/ReceiveKeysDialog";
import { KeyOrder, KeyOrderStatus } from "@/types/database";

interface KeyOrdersTableProps {
  orders: KeyOrder[];
}

export function KeyOrdersTable({ orders }: KeyOrdersTableProps) {
  const [selectedOrder, setSelectedOrder] = useState<KeyOrder | null>(null);
  const [showReceiveDialog, setShowReceiveDialog] = useState(false);

  const handleReceiveKeys = (order: KeyOrder) => {
    setSelectedOrder(order);
    setShowReceiveDialog(true);
  };

  if (orders.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No key orders found</p>
      </Card>
    );
  }

  const getStatusBadge = (status: KeyOrderStatus) => {
    switch (status) {
      case 'ordered':
        return <Badge variant="outline" className="flex items-center gap-1"><Clock className="h-3 w-3" /> Ordered</Badge>;
      case 'partially_received':
        return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="h-3 w-3" /> Partial</Badge>;
      case 'received':
        return <Badge variant="default" className="flex items-center gap-1 bg-green-500"><CheckCircle className="h-3 w-3" /> Received</Badge>;
      case 'cancelled':
        return <Badge variant="destructive" className="flex items-center gap-1"><X className="h-3 w-3" /> Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <>
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
                  <div className="font-medium">{order.key_name || 'Key Order'}</div>
                  <div className="text-xs text-muted-foreground">{order.key_type || 'Standard'}</div>
                </TableCell>
                <TableCell>{order.quantity}</TableCell>
                <TableCell>{order.ordered_at ? format(new Date(order.ordered_at), "MMM d, yyyy") : 'Not set'}</TableCell>
                <TableCell>
                  {order.expected_delivery_date 
                    ? format(new Date(order.expected_delivery_date), "MMM d, yyyy") 
                    : "Not specified"}
                </TableCell>
                <TableCell>{getStatusBadge(order.status)}</TableCell>
                <TableCell>
                  {order.recipient_name 
                    ? <div>{order.recipient_name}<div className="text-xs text-muted-foreground">{order.recipient_department || 'No department'}</div></div> 
                    : "General inventory"}
                </TableCell>
                <TableCell>
                  {(order.status === 'ordered' || order.status === 'partially_received') && (
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleReceiveKeys(order)}
                        className="h-8"
                      >
                        Receive
                      </Button>
                    </div>
                  )}
                  {order.status === 'received' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => console.log('Mark as delivered:', order.id)}
                      className="h-8"
                    >
                      <ArrowRight className="h-3 w-3 mr-1" />
                      Deliver
                    </Button>
                  )}
                  {order.status === 'cancelled' && (
                    <span className="text-xs text-muted-foreground">No actions available</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedOrder && (
        <ReceiveKeysDialog
          order={selectedOrder as any}
          open={showReceiveDialog}
          onOpenChange={setShowReceiveDialog}
          onSubmit={async () => {}}
          isSubmitting={false}
        />
      )}
    </>
  );
}