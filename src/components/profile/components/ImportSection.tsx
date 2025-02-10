
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface ImportSectionProps {
  isImporting: boolean;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ImportSection({ isImporting, onImport }: ImportSectionProps) {
  return (
    <div className="space-y-4 p-6 bg-muted/50 rounded-lg">
      <div className="flex items-start gap-4">
        <div className="mt-1">
          <Upload className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Import Database</h3>
          <p className="text-sm text-muted-foreground">
            Update the database by uploading an Excel file. The file structure should match the exported format.
            <span className="block mt-1 text-yellow-600 dark:text-yellow-400">
              ⚠️ This will update existing records if they share the same ID.
            </span>
          </p>
          <Button
            onClick={() => document.getElementById('file-upload')?.click()}
            disabled={isImporting}
            className="w-full sm:w-auto"
          >
            {isImporting ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Importing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Import from Excel
              </>
            )}
          </Button>
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept=".xlsx,.xls"
            onChange={onImport}
            disabled={isImporting}
          />
        </div>
      </div>
    </div>
  );
}
