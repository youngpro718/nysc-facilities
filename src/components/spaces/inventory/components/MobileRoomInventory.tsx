import { useState } from "react";
import { useInventory } from "../hooks/useInventory";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { InventoryFormInputs, InventoryItem } from "../types/inventoryTypes";
import { exportToExcel, parseExcelFile } from "../excelUtils";
import { AddInventoryDialog } from "../AddInventoryDialog";
import { EditInventoryDialog } from "../EditInventoryDialog";
import { MobileInventoryHeader } from "./MobileInventoryHeader";
import { MobileInventoryGrid } from "./MobileInventoryGrid";

export function MobileRoomInventory({ roomId }: { roomId: string }) {
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
    (item.category?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.description || '').toLowerCase().includes(searchQuery.toLowerCase())
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
      toast({
        title: "Success",
        description: "Item added successfully.",
      });
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
      toast({
        title: "Success",
        description: "Item updated successfully.",
      });
    } catch (error) {
      console.error('Error editing item:', error);
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
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <MobileInventoryHeader
          onExport={handleExport}
          onImport={handleImport}
          onAddItem={() => setIsAddDialogOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          itemCount={filteredInventory?.length || 0}
        />
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <MobileInventoryGrid
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
    </div>
  );
}