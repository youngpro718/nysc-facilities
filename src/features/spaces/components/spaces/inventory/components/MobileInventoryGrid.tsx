import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { ArrowRightLeft, MoreVertical, Plus, Minus, Package2, Trash2, X } from "lucide-react";
import { InventoryItem } from "../types/inventoryTypes";
import { useMemo, useState } from "react";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";
import { getGenericItemImage } from "@/utils/inventoryImages";
import { TransferItemDialog } from "./TransferItemDialog";
import { BulkTransferDialog } from "./BulkTransferDialog";

interface MobileInventoryGridProps {
  items: InventoryItem[];
  isLoading: boolean;
  isUpdatingQuantity: boolean;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onEditItem: (item: InventoryItem) => void;
  onDeleteItem: (id: string) => void;
  onDeleteItems?: (ids: string[]) => void | Promise<unknown>;
}

export function MobileInventoryGrid({
  items,
  isLoading,
  isUpdatingQuantity,
  onUpdateQuantity,
  onEditItem,
  onDeleteItem,
  onDeleteItems
}: MobileInventoryGridProps) {
  const [confirmDeleteItem, confirmDeleteDialog] = useConfirmDialog();
  const [transferItem, setTransferItem] = useState<InventoryItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkTransferOpen, setBulkTransferOpen] = useState(false);

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => a.name.localeCompare(b.name)),
    [items]
  );
  const selectedItems = useMemo(
    () => sortedItems.filter(item => selectedIds.has(item.id)),
    [sortedItems, selectedIds]
  );
  const allSelected = sortedItems.length > 0 && selectedItems.length === sortedItems.length;

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

  if (isLoading) {
    return (
      <div className="grid gap-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="h-24 animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Package2 className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium text-muted-foreground">No items found</p>
        <p className="text-sm text-muted-foreground">Add your first inventory item to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 mr-auto">
          <Checkbox
            id="mobile-select-all"
            checked={allSelected}
            onCheckedChange={() =>
              setSelectedIds(allSelected ? new Set() : new Set(sortedItems.map(item => item.id)))
            }
            aria-label="Select all items"
          />
          <label htmlFor="mobile-select-all" className="text-sm text-muted-foreground">
            {selectedItems.length > 0 ? `${selectedItems.length} selected` : "Select all"}
          </label>
        </div>
        {selectedItems.length > 0 && (
          <>
            <Button variant="outline" size="sm" onClick={() => setBulkTransferOpen(true)}>
              <ArrowRightLeft className="mr-1 h-4 w-4" />
              Transfer
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive"
              onClick={handleBulkDelete}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Delete
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
              <X className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
      <div className="grid gap-3 max-h-[60vh] overflow-y-auto">
      {sortedItems.map(item => (
        <Card key={item.id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="shrink-0 pt-1">
                <Checkbox
                  checked={selectedIds.has(item.id)}
                  onCheckedChange={() => toggleSelect(item.id)}
                  aria-label={`Select ${item.name}`}
                />
              </div>
              {/* Item Photo */}
              <div className="shrink-0">
                <img
                  src={item.photo_url || getGenericItemImage(item.name)}
                  alt={item.name}
                  loading="lazy"
                  className="w-16 h-16 object-cover rounded-lg border"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-base leading-tight truncate pr-2">
                    {item.name}
                  </h4>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEditItem(item)}>
                        Edit Item
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTransferItem(item)}>
                        Transfer Item
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={async () => {
                          const ok = await confirmDeleteItem({ title: 'Delete Item', description: 'Are you sure you want to delete this item? This cannot be undone.', confirmLabel: 'Delete', variant: 'destructive' });
                          if (ok) onDeleteItem(item.id);
                        }}
                      >
                        Delete Item
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  {item.category && (
                    <Badge
                      variant="outline"
                      className="text-xs"
                      style={{
                        backgroundColor: `${item.category.color}20`,
                        borderColor: item.category.color
                      }}
                    >
                      {item.category.name}
                    </Badge>
                  )}
                  <Badge
                    variant={item.quantity < (item.minimum_quantity || 0) ? "destructive" : "default"}
                    className="text-xs"
                  >
                    {item.quantity < (item.minimum_quantity || 0) ? "Low Stock" : "In Stock"}
                  </Badge>
                </div>

                {item.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {item.description}
                  </p>
                )}

                {item.location_details && (
                  <p className="text-xs text-muted-foreground mb-3 bg-muted/50 px-2 py-1 rounded">
                    📍 {item.location_details}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleQuantityChange(item.id, item.quantity, -1)}
                      disabled={item.quantity <= 0 || isUpdatingQuantity}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="font-mono text-lg font-medium min-w-[3rem] text-center">
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleQuantityChange(item.id, item.quantity, 1)}
                      disabled={isUpdatingQuantity}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>

                  {item.unit && (
                    <span className="text-sm text-muted-foreground">{item.unit}</span>
                  )}
                </div>

                {item.minimum_quantity && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Min: {item.minimum_quantity}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      </div>
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
    </div>
  );
}
