
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface KeyInventoryHeaderProps {
  onAddKey: () => void;
}

export function KeyInventoryHeader({ onAddKey }: KeyInventoryHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold">Key Inventory</h2>
        <p className="text-muted-foreground">Manage your key stock and inventory</p>
      </div>
      <Button onClick={onAddKey}>
        <Plus className="h-4 w-4 mr-2" />
        Add Key
      </Button>
    </div>
  );
}
