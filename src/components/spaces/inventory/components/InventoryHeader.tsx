
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Package, Search, Download, Upload, Plus } from "lucide-react";

interface InventoryHeaderProps {
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onAddItem: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export function InventoryHeader({
  onExport,
  onImport,
  onAddItem,
  searchQuery,
  onSearchChange,
}: InventoryHeaderProps) {
  return (
    <CardHeader>
      <div className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Inventory
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" asChild>
            <label className="cursor-pointer">
              <Upload className="h-4 w-4 mr-2" />
              Import
              <input
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={onImport}
              />
            </label>
          </Button>
          <Button onClick={onAddItem}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search inventory..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>
    </CardHeader>
  );
}
