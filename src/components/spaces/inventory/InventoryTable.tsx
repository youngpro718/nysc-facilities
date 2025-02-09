
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MinusCircle, PlusCircle, Trash2 } from "lucide-react";
import { InventoryItem } from "./types";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";

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
          {items?.map((item) => (
            <TableRow key={item.id} className="hover:bg-muted/50">
              <TableCell>
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <span className="cursor-help font-medium">{item.name}</span>
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
                        <p className="text-sm">Minimum Quantity: {item.minimum_quantity}</p>
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
                  <span className="w-12 text-center">{item.quantity}</span>
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
                {isLowStock(item) ? (
                  <Badge variant="destructive">Low Stock</Badge>
                ) : (
                  <Badge variant="secondary">In Stock</Badge>
                )}
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
          ))}
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
