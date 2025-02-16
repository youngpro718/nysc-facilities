
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { ExportableTable } from "../backupUtils";
import { useState } from "react";

interface ExportSectionProps {
  isExporting: boolean;
  onExport: (selectedTables: ExportableTable[]) => void;
  exportableTables: readonly ExportableTable[];
}

export function ExportSection({ isExporting, onExport, exportableTables }: ExportSectionProps) {
  const [selectedTables, setSelectedTables] = useState<ExportableTable[]>([]);

  return (
    <div className="space-y-4 p-6 bg-muted/50 rounded-lg">
      <div className="flex items-start gap-4">
        <div className="mt-1">
          <Download className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Export Database</h3>
          <p className="text-sm text-muted-foreground">
            Download a complete backup of the database as an Excel file. Select specific tables or export all.
          </p>
          <div className="space-y-2">
            <select
              multiple
              className="w-full p-2 rounded-md border"
              onChange={(e) => {
                const options = Array.from(e.target.selectedOptions, option => option.value as ExportableTable);
                setSelectedTables(options);
              }}
            >
              {exportableTables.map(table => (
                <option key={table} value={table}>
                  {table}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Hold Ctrl/Cmd to select multiple tables. If none selected, all tables will be exported.
            </p>
          </div>
          <Button
            onClick={() => onExport(selectedTables)}
            disabled={isExporting}
            className="w-full sm:w-auto"
          >
            {isExporting ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export to Excel
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
