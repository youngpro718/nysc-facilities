
import { useState } from "react";
import { InventoryActions } from "./inventory/InventoryActions";
import { InventoryTable } from "./inventory/InventoryTable";
import { useInventory } from "./inventory/hooks/useInventory";
import { InventoryItem } from "./inventory/types/inventoryTypes";

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

  const handleAddItem = (
    name: string, 
    quantity: number, 
    categoryId: string,
    description?: string,
    minQuantity?: number,
    unit?: string
  ) => {
    addItemMutation.mutate({ 
      name, 
      quantity, 
      categoryId,
      description,
      minimum_quantity: minQuantity,
      unit
    });
  };

  return (
    <div className="space-y-4">
      <InventoryActions
        onAddItem={handleAddItem}
        onSearch={setSearch}
        inventoryData={inventoryData as InventoryItem[]}
      />

      <InventoryTable
        items={filteredItems}
        onUpdateQuantity={(id, quantity) => updateQuantityMutation.mutate({ id, quantity })}
        onDeleteItem={(id) => deleteItemMutation.mutate(id)}
      />
    </div>
  );
}
