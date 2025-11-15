
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { CategorySelector } from "./CategorySelector";

interface AddItemFormProps {
  onAddItem: (name: string, quantity: number, categoryId: string) => void;
  newItemName: string;
  setNewItemName: (value: string) => void;
  newItemQuantity: number;
  setNewItemQuantity: (value: number) => void;
  selectedCategory: string;
  setSelectedCategory: (value: string) => void;
}

export function AddItemForm({
  onAddItem,
  newItemName,
  setNewItemName,
  newItemQuantity,
  setNewItemQuantity,
  selectedCategory,
  setSelectedCategory
}: AddItemFormProps) {
  return (
    <div className="flex-1 flex gap-2">
      <Input
        placeholder="Item name"
        value={newItemName}
        onChange={(e) => setNewItemName(e.target.value)}
      />
      <Input
        type="number"
        min="1"
        value={newItemQuantity}
        onChange={(e) => setNewItemQuantity(parseInt(e.target.value))}
        className="w-24"
      />
      <div className="w-48">
        <CategorySelector
          value={selectedCategory}
          onValueChange={setSelectedCategory}
        />
      </div>
      <Button onClick={() => onAddItem(newItemName, newItemQuantity, selectedCategory)}>
        <Plus className="h-4 w-4 mr-2" />
        Add Item
      </Button>
    </div>
  );
}
