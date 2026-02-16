// @ts-nocheck
import { useState } from "react";
import { logger } from '@/lib/logger';
import { useInventory } from "./inventory/hooks/useInventory";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { InventoryFormInputs, InventoryItem } from "./inventory/types/inventoryTypes";
import { AddInventoryDialog } from "./inventory/AddInventoryDialog";
import { EditInventoryDialog } from "./inventory/EditInventoryDialog";
import { InventoryHeader } from "./inventory/components/InventoryHeader";
import { InventoryTable } from "./inventory/components/InventoryTable";
import { EnhancedInventoryImportExport } from "./inventory/EnhancedInventoryImportExport";

export function RoomInventory({ roomId }: { roomId: string }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const { toast } = useToast();
  
  const {
    inventory,
    isLoading,
    addItem,
    editItem,
    updateQuantity,
    deleteItem,
    isAddingItem,
    isEditingItem,
    isUpdatingQuantity,
    isDeletingItem,
    addBulkItems
  } = useInventory(roomId);

  const filteredInventory = inventory?.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.category?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (data: InventoryFormInputs) => {
    try {
      await addItem({
        ...data,
        storage_room_id: roomId,
        status: 'active',
        quantity: data.quantity || 0
      });
      setIsAddDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async (data: InventoryFormInputs) => {
    if (!selectedItem) return;

    try {
      await editItem({
        id: selectedItem.id,
        ...data,
      });
      setIsEditDialogOpen(false);
      setSelectedItem(null);
    } catch (error) {
      logger.error('Error editing item:', error);
      toast({
        title: "Error",
        description: "Failed to update item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleImportSuccess = async (importedItems: unknown[]) => {
    try {
      await addBulkItems(importedItems);
      toast({
        title: "Success",
        description: `Successfully imported ${importedItems.length} items.`,
      });
    } catch (error) {
      toast({
        title: "Import Error",
        description: "Some items failed to import. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateQuantity = async (id: string, quantity: number) => {
    await updateQuantity({ id, quantity });
  };

  return (
    <Card className="h-full">
      <InventoryHeader
        onExport={() => {}} // Legacy function - now handled by EnhancedInventoryImportExport
        onImport={() => {}} // Legacy function - now handled by EnhancedInventoryImportExport
        onAddItem={() => setIsAddDialogOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        customActions={
          <EnhancedInventoryImportExport
            inventoryData={inventory || []}
            onImportSuccess={handleImportSuccess}
          />
        }
      />
      <CardContent>
        <ScrollArea className="h-[calc(100vh-12rem)] border rounded-md">
          <InventoryTable
            items={filteredInventory || []}
            isLoading={isLoading}
            isUpdatingQuantity={isUpdatingQuantity}
            onUpdateQuantity={handleUpdateQuantity}
            onEditItem={(item) => {
              setSelectedItem(item);
              setIsEditDialogOpen(true);
            }}
            onDeleteItem={deleteItem}
          />
        </ScrollArea>
      </CardContent>
      <AddInventoryDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleSubmit}
        isSubmitting={isAddingItem}
      />
      {selectedItem && (
        <EditInventoryDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSubmit={handleEdit}
          isSubmitting={isEditingItem}
          initialData={selectedItem}
        />
      )}
    </Card>
  );
}
