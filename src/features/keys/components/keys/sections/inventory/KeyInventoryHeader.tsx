
import { Button } from "@/components/ui/button";
import { Plus, Download, Upload } from "lucide-react";

interface KeyInventoryHeaderProps {
  onAddKey: () => void;
  onExport?: () => void;
  onImport?: () => void;
}

export function KeyInventoryHeader({ onAddKey, onExport, onImport }: KeyInventoryHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold">Key Inventory</h2>
        <p className="text-muted-foreground">Manage your key stock and inventory</p>
      </div>
      <div className="flex items-center gap-2">
        {onExport && (
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
        )}
        {onImport && (
          <Button variant="outline" size="sm" onClick={onImport}>
            <Upload className="h-4 w-4 mr-2" /> Import CSV
          </Button>
        )}
        <Button onClick={onAddKey} data-tour="keys-create">
          <Plus className="h-4 w-4 mr-2" />
          Add Key
        </Button>
      </div>
    </div>
  );
}
