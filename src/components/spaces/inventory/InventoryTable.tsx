
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MinusCircle, PlusCircle, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { InventoryItem } from "./types/inventoryTypes";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface InventoryTableProps {
  items: InventoryItem[];
  onUpdateQuantity: (id: string, quantity: number) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
  isLoading?: boolean;
  isUpdating?: boolean;
  isDeleting?: boolean;
}

export function InventoryTable({ 
  items, 
  onUpdateQuantity, 
  onDeleteItem,
  isLoading,
  isUpdating,
  isDeleting 
}: InventoryTableProps) {
  const isLowStock = (item: InventoryItem) => {
    return item.minimum_quantity !== undefined && 
           item.quantity <= (item.minimum_quantity || 0);
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity === 0) {
      return { label: "Out of Stock", variant: "destructive" as const };
    }
    if (isLowStock(item)) {
      return { label: "Low Stock", variant: "outline" as const };
    }
    return { label: "In Stock", variant: "secondary" as const };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items?.map((item) => {
            const stockStatus = getStockStatus(item);
            const showWarning = isLowStock(item);

            return (
              <TableRow key={item.id} className={cn(
                "hover:bg-muted/50",
                showWarning && "bg-yellow-50/50"
              )}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {item.name}
                    {showWarning && (
                      <HoverCard>
                        <HoverCardTrigger>
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        </HoverCardTrigger>
                        <HoverCardContent>
                          Low stock warning: Quantity is at or below minimum level
                        </HoverCardContent>
                      </HoverCard>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {item.category && (
                    <Badge
                      variant="outline"
                      style={{ backgroundColor: item.category.color + "20" }}
                    >
                      {item.category.name}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 0 || isUpdating}
                    >
                      <MinusCircle className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center">{item.quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      disabled={isUpdating}
                    >
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={stockStatus.variant}>
                    {stockStatus.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeleteItem(item.id)}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
          {items.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                No items found. Add some items to get started.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
