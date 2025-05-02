
import { useState } from "react";
import { useKeyOrders } from "../hooks/useKeyOrders";
import { KeyOrdersTable } from "../components/KeyOrdersTable";
import { CreateKeyOrderDialog } from "../dialogs/CreateKeyOrderDialog";
import { ReceiveKeysDialog } from "../dialogs/ReceiveKeysDialog";
import { Button } from "@/components/ui/button";
import { Package, Plus } from "lucide-react";
import { KeyOrder } from "../types/OrderTypes";

export function KeyOrderSection() {
  const [createOrderDialogOpen, setCreateOrderDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<KeyOrder | null>(null);
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);

  const { 
    orders, 
    isLoadingOrders,
    createKeyOrder,
    receiveKeys,
    cancelOrder,
    isCreatingOrder,
    isReceivingOrder
  } = useKeyOrders();

  const handleReceiveKeys = async (orderId: string, quantityReceived: number) => {
    await receiveKeys({
      order_id: orderId,
      quantity_received: quantityReceived
    });
    setReceiveDialogOpen(false);
    setSelectedOrder(null);
  };

  const handleCancelOrder = async (orderId: string) => {
    if (window.confirm("Are you sure you want to cancel this order?")) {
      await cancelOrder(orderId);
    }
  };

  const openReceiveDialog = (order: KeyOrder) => {
    setSelectedOrder(order);
    setReceiveDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Key Orders</h2>
          <p className="text-muted-foreground">Track and manage key orders</p>
        </div>
        
        <Button onClick={() => setCreateOrderDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Order
        </Button>
      </div>

      <KeyOrdersTable
        orders={orders || []}
        isLoading={isLoadingOrders}
        onReceiveKeys={openReceiveDialog}
        onCancelOrder={handleCancelOrder}
      />

      <CreateKeyOrderDialog
        open={createOrderDialogOpen}
        onOpenChange={setCreateOrderDialogOpen}
        onSubmit={createKeyOrder}
        isSubmitting={isCreatingOrder}
      />

      {selectedOrder && (
        <ReceiveKeysDialog
          open={receiveDialogOpen}
          onOpenChange={setReceiveDialogOpen}
          order={selectedOrder}
          onSubmit={(quantity) => handleReceiveKeys(selectedOrder.id, quantity)}
          isSubmitting={isReceivingOrder}
        />
      )}
    </div>
  );
}
