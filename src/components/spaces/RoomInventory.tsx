
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { InventoryDialog } from "./inventory/InventoryDialog";
import { InventoryTable } from "./inventory/InventoryTable";
import { useInventory } from "./inventory/hooks/useInventory";
import { InventoryFormInputs, InventoryItem } from "./inventory/types/inventoryTypes";
import { InventoryImportExport } from "./inventory/InventoryImportExport";

export function RoomInventory({ roomId }: { roomId: string }) {
  const [search, setSearch] = useState("");

  const {
    inventoryData,
    isLoading,
    addItemMutation,
    updateQuantityMutation,
    deleteItemMutation
  } = useInventory(roomId);

  const filteredItems = (inventoryData as InventoryItem[]).filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddItem = async (data: InventoryFormInputs) => {
    await addItemMutation.mutateAsync(data);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold">Inventory</h3>
        <InventoryImportExport inventoryData={inventoryData as InventoryItem[]} />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Input
          placeholder="Search items..."
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-[300px]"
        />
        <InventoryDialog onSubmit={handleAddItem} />
      </div>

      <InventoryTable
        items={filteredItems}
        onUpdateQuantity={(id, quantity) => updateQuantityMutation.mutate({ id, quantity })}
        onDeleteItem={(id) => deleteItemMutation.mutate(id)}
      />
    </div>
  );
}
