
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";

interface InventoryHeaderProps {
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onAddItem: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  customActions?: React.ReactNode;
}

export function InventoryHeader({
  onExport,
  onImport,
  onAddItem,
  searchQuery,
  onSearchChange,
  customActions
}: InventoryHeaderProps) {
  return (
    <div className="p-6 border-b">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search inventory..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {customActions}
          <Button onClick={onAddItem}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>
    </div>
  );
}
