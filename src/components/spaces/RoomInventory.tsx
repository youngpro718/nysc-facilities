
import { useState } from "react";
import { useInventory } from "./inventory/hooks/useInventory";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { InventoryFormInputs, InventoryItem } from "./inventory/types/inventoryTypes";
import { exportToExcel, parseExcelFile } from "./inventory/excelUtils";
import { AddInventoryDialog } from "./inventory/AddInventoryDialog";
import { EditInventoryDialog } from "./inventory/EditInventoryDialog";
import { InventoryHeader } from "./inventory/components/InventoryHeader";
import { InventoryTable } from "./inventory/components/InventoryTable";

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
        storage_room_id: roomId,
      });
      setIsEditDialogOpen(false);
      setSelectedItem(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExport = () => {
    if (!inventory) return;
    
    const exportData = inventory.map(item => ({
      name: item.name,
      quantity: item.quantity,
      category: item.category?.name || 'General',
      description: item.description || '',
      minimum_quantity: item.minimum_quantity || 0,
      unit: item.unit || '',
      location_details: item.location_details || '',
      notes: item.notes || ''
    }));

    exportToExcel(exportData, `inventory_${new Date().toISOString().split('T')[0]}`);
    toast({
      title: "Success",
      description: "Inventory exported successfully",
    });
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await parseExcelFile(file);
      
      const itemsToImport = data.map(item => ({
        name: item.name,
        quantity: item.quantity,
        description: item.description,
        minimum_quantity: item.minimum_quantity,
        unit: item.unit,
        storage_room_id: roomId,
        status: 'active' as const,
        location_details: item.location_details,
        notes: item.notes
      }));

      await addBulkItems(itemsToImport);

      toast({
        title: "Success",
        description: `Imported ${data.length} items successfully.`,
      });
      event.target.value = '';
    } catch (error) {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to import inventory data.",
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
        onExport={handleExport}
        onImport={handleImport}
        onAddItem={() => setIsAddDialogOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
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
