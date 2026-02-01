
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Package, TrendingDown, ExternalLink } from "lucide-react";
import { InventoryItem } from "@/components/spaces/inventory/types/inventoryTypes";

interface LowStockAlertProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: InventoryItem[];
  roomName?: string;
  onManageItem?: (itemId: string) => void;
}

export function LowStockAlert({
  open,
  onOpenChange,
  items,
  roomName,
  onManageItem,
}: LowStockAlertProps) {
  // Low stock: 0 < quantity < minimum_quantity (use actual minimum, not forced)
  const lowStockItems = items.filter(item =>
    item.quantity > 0 && 
    (item.minimum_quantity || 0) > 0 && 
    item.quantity < (item.minimum_quantity || 0)
  );

  const outOfStockItems = items.filter(item => item.quantity === 0);

  const getStockStatus = (item: InventoryItem) => {
    const minQty = item.minimum_quantity || 0;
    if (item.quantity === 0) return { label: "Out of Stock", color: "bg-red-500" };
    if (minQty > 0 && item.quantity < minQty) return { label: "Low Stock", color: "bg-yellow-500" };
    return { label: "Normal", color: "bg-green-500" };
  };

  const getUrgencyBadge = (item: InventoryItem) => {
    const minQty = item.minimum_quantity || 0;
    if (item.quantity === 0) return { label: "Critical", variant: "destructive" as const };
    if (minQty > 0 && item.quantity < minQty / 2) return { label: "High", variant: "destructive" as const };
    return { label: "Medium", variant: "secondary" as const };
  };

  if (lowStockItems.length === 0 && outOfStockItems.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-green-500" />
              Stock Status - {roomName}
            </DialogTitle>
          </DialogHeader>
          <div className="text-center p-6">
            <div className="rounded-full bg-green-100 p-3 w-fit mx-auto mb-4">
              <Package className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="font-medium text-lg mb-2">All Items Well Stocked!</h3>
            <p className="text-sm text-muted-foreground">
              No items are currently running low in this storage room.
            </p>
          </div>
          <div className="flex justify-center">
            <Button onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Low Stock Alert - {roomName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-600">
                  Out of Stock
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {outOfStockItems.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Items that need immediate attention
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-amber-600">
                  Low Stock
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">
                  {lowStockItems.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Items running low
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Items List */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Items Requiring Attention</h3>
            
            {lowStockItems.map((item) => {
              const status = getStockStatus(item);
              const urgency = getUrgencyBadge(item);
              
              return (
                <Card key={item.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <div className={`w-3 h-3 rounded-full ${status.color}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{item.name}</h4>
                          <Badge variant={urgency.variant}>
                            {urgency.label}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                          <span>Current: {item.quantity} {item.unit || 'units'}</span>
                          <span>Minimum: {item.minimum_quantity || 0} {item.unit || 'units'}</span>
                        </div>

                        {item.category && (
                          <Badge variant="outline" className="text-xs">
                            {item.category.name}
                          </Badge>
                        )}

                        {item.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant="outline" className={`text-xs ${status.color.replace('bg-', 'text-')}`}>
                        {status.label}
                      </Badge>
                      
                      {onManageItem && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onManageItem(item.id)}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Manage
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {lowStockItems.length} item{lowStockItems.length !== 1 ? 's' : ''} need attention
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button onClick={() => onOpenChange(false)}>
                Request Restock
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
