
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MinusCircle, PlusCircle, Trash2, AlertTriangle } from "lucide-react";
import { InventoryItem } from "./types";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface InventoryTableProps {
  items: InventoryItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onDeleteItem: (id: string) => void;
}

export function InventoryTable({ items, onUpdateQuantity, onDeleteItem }: InventoryTableProps) {
  const isLowStock = (item: InventoryItem) => {
    return item.minimum_quantity !== undefined && 
           item.quantity <= (item.minimum_quantity || 0);
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity === 0) {
      return { label: "Out of Stock", variant: "destructive" as const };
    }
    if (isLowStock(item)) {
      return { label: "Low Stock", variant: "warning" as const };
    }
    return { label: "In Stock", variant: "secondary" as const };
  };

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
                showWarning && "bg-red-50/50 dark:bg-red-950/20"
              )}>
                <TableCell>
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <div className="flex items-center gap-2 cursor-help">
                        <span className="font-medium">{item.name}</span>
                        {showWarning && (
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        )}
                      </div>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80">
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold">{item.name}</h4>
                        {item.description && (
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        )}
                        {item.unit && (
                          <p className="text-sm">Unit: {item.unit}</p>
                        )}
                        {item.minimum_quantity !== undefined && (
                          <p className="text-sm">
                            Minimum Quantity: {item.minimum_quantity}
                            {showWarning && (
                              <span className="text-yellow-600 ml-2">
                                (Currently below minimum)
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.category?.color }}
                    />
                    <span>{item.category?.name || 'General'}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
                    >
                      <MinusCircle className="h-4 w-4" />
                    </Button>
                    <span className={cn(
                      "w-12 text-center",
                      showWarning && "text-yellow-600 font-medium",
                      item.quantity === 0 && "text-red-600 font-medium"
                    )}>
                      {item.quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
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
                    variant="destructive"
                    size="sm"
                    onClick={() => onDeleteItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
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
