
import { Input } from "@/components/ui/input";
import { InventoryImportExport } from "./InventoryImportExport";
import { InventoryItem } from "./types";
import { AddItemDialog } from "./AddItemDialog";

interface InventoryActionsProps {
  onAddItem: (name: string, quantity: number, categoryId: string, description?: string, minQuantity?: number, unit?: string) => void;
  onSearch: (query: string) => void;
  inventoryData: InventoryItem[];
}

export function InventoryActions({
  onAddItem,
  onSearch,
  inventoryData
}: InventoryActionsProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold">Inventory</h3>
        <InventoryImportExport inventoryData={inventoryData} />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Input
          placeholder="Search items..."
          onChange={(e) => onSearch(e.target.value)}
          className="sm:max-w-[300px]"
        />
        <AddItemDialog onAddItem={onAddItem} />
      </div>
    </div>
  );
}
