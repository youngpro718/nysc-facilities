import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil } from "lucide-react";
import { InventoryItem } from "../types/inventoryTypes";
interface InventoryTableProps {
  items: InventoryItem[];
  isLoading: boolean;
  isUpdatingQuantity: boolean;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onEditItem: (item: InventoryItem) => void;
  onDeleteItem: (id: string) => void;
}
export function InventoryTable({
  items,
  isLoading,
  isUpdatingQuantity,
  onUpdateQuantity,
  onEditItem,
  onDeleteItem
}: InventoryTableProps) {
  return <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Item</TableHead>
          <TableHead>Category</TableHead>
          <TableHead className="px-[51px]">Quantity</TableHead>
          <TableHead className="px-[25px]">Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items?.map(item => <TableRow key={item.id}>
            <TableCell className="font-medium">
              {item.name}
            </TableCell>
            <TableCell>
              {item.category && <Badge variant="outline" style={{
            backgroundColor: `${item.category.color}20`,
            borderColor: item.category.color
          }} className="px-0">
                  {item.category.name}
                </Badge>}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2 px-0 my-0 py-0">
                <Button variant="outline" size="sm" onClick={() => onUpdateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 0 || isUpdatingQuantity}>
                  -
                </Button>
                <span className="w-12 text-center">{item.quantity}</span>
                <Button variant="outline" size="sm" onClick={() => onUpdateQuantity(item.id, item.quantity + 1)} disabled={isUpdatingQuantity}>
                  +
                </Button>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={item.quantity <= (item.minimum_quantity || 0) ? "destructive" : "default"}>
                {item.quantity <= (item.minimum_quantity || 0) ? "Low Stock" : "In Stock"}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => onEditItem(item)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                if (window.confirm('Are you sure you want to delete this item?')) {
                  onDeleteItem(item.id);
                }
              }}>
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>)}
        {!isLoading && (!items || items.length === 0) && <TableRow>
            <TableCell colSpan={5} className="h-24 text-center">
              No items found
            </TableCell>
          </TableRow>}
      </TableBody>
    </Table>;
}