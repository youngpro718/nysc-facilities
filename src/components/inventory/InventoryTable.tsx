          import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InventoryForm } from "./InventoryForm";
import { toast } from "@/components/ui/use-toast";

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  minimum_quantity?: number;
  category?: {
    id: string;
    name: string;
    color?: string;
  };
  description?: string;
  unit?: string;
  location_details?: string;
  status?: "available" | "low_stock" | "out_of_stock";
  updated_at?: string;
}

interface InventoryTableProps {
  items: InventoryItem[];
  categories: Array<{ id: string; name: string }>;
  onUpdateItem: (id: string, data: Partial<InventoryItem>) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
  isLoading?: boolean;
}

export function InventoryTable({
  items,
  categories,
  onUpdateItem,
  onDeleteItem,
  isLoading,
}: InventoryTableProps) {
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleEdit = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await onDeleteItem(id);
      toast({
        title: "Item Deleted",
        description: "The inventory item has been deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete the item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdate = async (data: Partial<InventoryItem>) => {
    if (!selectedItem) return;

    try {
      await onUpdateItem(selectedItem.id, data);
      setIsEditDialogOpen(false);
      setSelectedItem(null);
      toast({
        title: "Item Updated",
        description: "The inventory item has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update the item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "low_stock":
        return <Badge variant="secondary">Low Stock</Badge>;
      case "out_of_stock":
        return <Badge variant="destructive">Out of Stock</Badge>;
      default:
        return <Badge variant="default">Available</Badge>;
    }
  };

  return (
    <>
      <div className="rounded-md border overflow-x-auto">
        <Table className="min-w-max">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  <TableCell className="font-medium"><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-3 w-3 rounded-full" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))
            )}
            {!isLoading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No inventory items found.
                </TableCell>
              </TableRow>
            )}
            {!isLoading && items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>
                  {item.category ? (
                    <div className="flex items-center gap-2">
                      {item.category.color && (
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.category.color }}
                        />
                      )}
                      {item.category.name}
                    </div>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {item.quantity} {item.unit}
                </TableCell>
                <TableCell>{getStatusBadge(item.status)}</TableCell>
                <TableCell>{item.location_details || "—"}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-11 w-11 p-0"
                        aria-label="Open menu"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleEdit(item)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600 dark:text-red-400"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Inventory Item</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <InventoryForm
              initialData={selectedItem}
              onSubmit={handleUpdate}
              categories={categories}
              isLoading={isLoading}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
