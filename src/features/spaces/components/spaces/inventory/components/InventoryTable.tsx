
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ArrowRightLeft, MoreHorizontal, Pencil, Trash2, X } from "lucide-react";
import { InventoryItem } from "../types/inventoryTypes";
import { useMemo, useState } from "react";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";
import { getGenericItemImage } from "@/utils/inventoryImages";
import { TransferItemDialog } from "./TransferItemDialog";
import { BulkTransferDialog } from "./BulkTransferDialog";

interface InventoryTableProps {
  items: InventoryItem[];
  isLoading: boolean;
  isUpdatingQuantity: boolean;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onEditItem: (item: InventoryItem) => void;
  onDeleteItem: (id: string) => void;
  onDeleteItems?: (ids: string[]) => void | Promise<unknown>;
}

export function InventoryTable({
  items,
  isLoading,
  isUpdatingQuantity,
  onUpdateQuantity,
  onEditItem,
  onDeleteItem,
  onDeleteItems
}: InventoryTableProps) {
  const [confirmDeleteItem, confirmDeleteDialog] = useConfirmDialog();
  const [transferItem, setTransferItem] = useState<InventoryItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkTransferOpen, setBulkTransferOpen] = useState(false);
  // Sort items by name to maintain stable order
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);

  // Only keep selections that still exist in the current item list
  const selectedItems = useMemo(
    () => sortedItems.filter(item => selectedIds.has(item.id)),
    [sortedItems, selectedIds]
  );
  const allSelected = sortedItems.length > 0 && selectedItems.length === sortedItems.length;
  const someSelected = selectedItems.length > 0 && !allSelected;

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(sortedItems.map(item => item.id)));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    const ids = selectedItems.map(item => item.id);
    if (ids.length === 0) return;
    const ok = await confirmDeleteItem({
      title: `Delete ${ids.length} Item${ids.length === 1 ? '' : 's'}`,
      description: `Are you sure you want to delete ${ids.length === 1 ? 'this item' : `these ${ids.length} items`}? This cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'destructive'
    });
    if (!ok) return;
    if (onDeleteItems) {
      await onDeleteItems(ids);
    } else {
      for (const id of ids) onDeleteItem(id);
    }
    setSelectedIds(new Set());
  };

  const handleQuantityChange = (itemId: string, currentQuantity: number, change: number) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity >= 0) {
      onUpdateQuantity(itemId, newQuantity);
    }
  };

  // Fixed low stock logic: 0 < quantity <= minimum_quantity
  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity === 0) {
      return { label: "Out of Stock", variant: "destructive" as const };
    }
    if ((item.minimum_quantity || 0) > 0 && item.quantity > 0 && item.quantity <= (item.minimum_quantity || 0)) {
      return { label: "Low Stock", variant: "secondary" as const };
    }
    return { label: "In Stock", variant: "default" as const };
  };

  return (
    <>
    {selectedItems.length > 0 && (
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b bg-muted/90 p-2 backdrop-blur">
        <span className="text-sm font-medium px-2">
          {selectedItems.length} selected
        </span>
        <Button variant="outline" size="sm" onClick={() => setBulkTransferOpen(true)}>
          <ArrowRightLeft className="mr-2 h-4 w-4" />
          Transfer Selected
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
          onClick={handleBulkDelete}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Selected
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
          <X className="mr-2 h-4 w-4" />
          Clear
        </Button>
      </div>
    )}
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[40px]">
            <Checkbox
              checked={allSelected ? true : someSelected ? "indeterminate" : false}
              onCheckedChange={toggleSelectAll}
              aria-label="Select all items"
            />
          </TableHead>
          <TableHead className="w-[60px]"></TableHead>
          <TableHead>Item</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Quantity</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedItems?.map(item => {
          const stockStatus = getStockStatus(item);

          return (
            <TableRow key={item.id} data-state={selectedIds.has(item.id) ? "selected" : undefined}>
              <TableCell className="w-[40px]">
                <Checkbox
                  checked={selectedIds.has(item.id)}
                  onCheckedChange={() => toggleSelect(item.id)}
                  aria-label={`Select ${item.name}`}
                />
              </TableCell>
              <TableCell className="w-[60px] p-2">
                <img
                  src={item.photo_url || getGenericItemImage(item.name)}
                  alt={item.name}
                  loading="lazy"
                  className="w-10 h-10 object-cover rounded-md border"
                />
              </TableCell>
              <TableCell className="font-medium">
                {item.name}
              </TableCell>
              <TableCell>
                {item.category && (
                  <Badge
                    variant="outline"
                    style={{
                      backgroundColor: `${item.category.color}20`,
                      borderColor: item.category.color
                    }}
                  >
                    {item.category.name}
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuantityChange(item.id, item.quantity, -1)}
                    disabled={item.quantity <= 0 || isUpdatingQuantity}
                  >
                    -
                  </Button>
                  <span className="w-12 text-center">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuantityChange(item.id, item.quantity, 1)}
                    disabled={isUpdatingQuantity}
                  >
                    +
                  </Button>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={stockStatus.variant}>
                  {stockStatus.label}
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
                    <DropdownMenuItem onClick={() => setTransferItem(item)}>
                      <ArrowRightLeft className="mr-2 h-4 w-4" />
                      Transfer
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={async () => {
                      const ok = await confirmDeleteItem({ title: 'Delete Item', description: 'Are you sure you want to delete this item? This cannot be undone.', confirmLabel: 'Delete', variant: 'destructive' });
                      if (ok) onDeleteItem(item.id);
                    }}>
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          );
        })}
        {!isLoading && (!items || items.length === 0) && (
          <TableRow>
            <TableCell colSpan={7} className="h-24 text-center">
              No items found
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
    {confirmDeleteDialog}
    {transferItem && (
      <TransferItemDialog
        item={transferItem}
        currentRoomId={transferItem.storage_room_id}
        open={!!transferItem}
        onOpenChange={(open) => !open && setTransferItem(null)}
      />
    )}
    {bulkTransferOpen && selectedItems.length > 0 && (
      <BulkTransferDialog
        items={selectedItems}
        currentRoomId={selectedItems[0].storage_room_id}
        open={bulkTransferOpen}
        onOpenChange={setBulkTransferOpen}
        onTransferred={() => setSelectedIds(new Set())}
      />
    )}
    </>
  );
}
