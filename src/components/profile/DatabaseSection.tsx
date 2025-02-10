
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Database, History } from "lucide-react";
import { useState } from "react";
import { BackupVersion, ExportableTable, fetchBackupVersions, restoreBackup } from "./backupUtils";
import { exportDatabase } from "./utils/databaseExport";
import { importDatabase } from "./utils/databaseImport";
import { BackupHistoryDialog } from "./components/BackupHistoryDialog";
import { ExportSection } from "./components/ExportSection";
import { ImportSection } from "./components/ImportSection";

const EXPORTABLE_TABLES = [
  'buildings',
  'floors',
  'rooms',
  'occupants',
  'keys',
  'key_assignments',
  'lighting_fixtures',
  'lighting_zones',
  'issues'
] as const;

export function DatabaseSection() {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [backupVersions, setBackupVersions] = useState<BackupVersion[]>([]);

  const loadBackupHistory = async () => {
    try {
      const versions = await fetchBackupVersions();
      setBackupVersions(versions);
    } catch (error) {
      console.error('Error loading backup history:', error);
      toast({
        title: "Error Loading History",
        description: "Could not load backup history.",
        variant: "destructive",
      });
    }
  };

  const handleExportDatabase = async (selectedTables: ExportableTable[]) => {
    try {
      setIsExporting(true);
      const fileName = await exportDatabase(selectedTables, EXPORTABLE_TABLES);
      toast({
        title: "Export Successful",
        description: "Database has been exported to Excel successfully.",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "There was an error exporting the database.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportDatabase = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      await importDatabase(file, EXPORTABLE_TABLES);
      toast({
        title: "Import Successful",
        description: "Database has been updated from Excel successfully.",
      });
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: "There was an error importing the database.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleRestoreBackup = async (backup: BackupVersion) => {
    try {
      await restoreBackup(backup.id, backup.tables);
      toast({
        title: "Restore Started",
        description: "Backup restoration has been initiated.",
      });
    } catch (error) {
      console.error('Restore error:', error);
      toast({
        title: "Restore Failed",
        description: "There was an error starting the backup restoration.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold">Database Management</h2>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setShowHistory(true);
              loadBackupHistory();
            }}
          >
            <History className="mr-2 h-4 w-4" />
            Backup History
          </Button>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          <ExportSection
            isExporting={isExporting}
            onExport={handleExportDatabase}
            exportableTables={EXPORTABLE_TABLES}
          />
          <ImportSection
            isImporting={isImporting}
            onImport={handleImportDatabase}
          />
        </div>

        <div className="mt-6 rounded-lg bg-muted p-4">
          <h4 className="text-sm font-medium mb-2">Important Notes:</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>Exports include all facility data including buildings, floors, rooms, and related information</li>
            <li>Large databases may take a few moments to process</li>
            <li>Make sure to keep a backup of your data before importing new records</li>
            <li>The import process will validate data before making any changes</li>
            <li>Backups can be encrypted and compressed for additional security and storage optimization</li>
          </ul>
        </div>

        <BackupHistoryDialog
          open={showHistory}
          onOpenChange={setShowHistory}
          backupVersions={backupVersions}
          onRestore={handleRestoreBackup}
        />
      </div>
    </Card>
  );
}
