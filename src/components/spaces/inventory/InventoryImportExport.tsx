
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Import } from "lucide-react";
import { InventoryItem } from "./types";
import { exportToExcel, parseExcelFile } from "./excelUtils";
import { useToast } from "@/hooks/use-toast";

interface InventoryImportExportProps {
  inventoryData: InventoryItem[];
}

export function InventoryImportExport({ inventoryData }: InventoryImportExportProps) {
  const { toast } = useToast();

  const handleExport = () => {
    if (!inventoryData) return;
    
    const exportData = inventoryData.map(item => ({
      name: item.name,
      quantity: item.quantity,
      category: item.category?.name || 'General',
      description: item.description,
      minimum_quantity: item.minimum_quantity,
      unit: item.unit
    }));

    exportToExcel(exportData, `inventory`);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await parseExcelFile(file);
      toast({
        title: "Import successful",
        description: `Imported ${data.length} items.`,
      });
    } catch (error) {
      toast({
        title: "Import failed",
        description: "Failed to import inventory data.",
        variant: "destructive",
      });
      console.error('Import error:', error);
    }
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={handleExport}>
        <FileSpreadsheet className="h-4 w-4 mr-2" />
        Export
      </Button>
      <Button variant="outline" size="sm" asChild>
        <label>
          <Import className="h-4 w-4 mr-2" />
          Import
          <input
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleImport}
          />
        </label>
      </Button>
    </div>
  );
}
