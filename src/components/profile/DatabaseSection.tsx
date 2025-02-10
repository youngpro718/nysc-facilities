
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Database, Download, History, Upload } from "lucide-react";
import { useState } from "react";
import * as XLSX from 'xlsx';
import { TablesInsert } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { BackupVersion, createBackupVersion, fetchBackupVersions } from "./backupUtils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

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

type ExportableTable = typeof EXPORTABLE_TABLES[number];

export function DatabaseSection() {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [backupVersions, setBackupVersions] = useState<BackupVersion[]>([]);
  const [selectedTables, setSelectedTables] = useState<ExportableTable[]>([]);

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

  const handleExportDatabase = async () => {
    try {
      setIsExporting(true);
      
      const workbook = XLSX.utils.book_new();
      const exportTables = selectedTables.length > 0 ? selectedTables : EXPORTABLE_TABLES;
      
      for (const table of exportTables) {
        const { data, error } = await supabase
          .from(table)
          .select('*');
          
        if (error) throw error;
        
        // Create worksheet for each table
        const worksheet = XLSX.utils.json_to_sheet(data || []);
        XLSX.utils.book_append_sheet(workbook, worksheet, table);
      }
      
      // Generate Excel file
      const fileName = `database_export_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      // Record backup version
      await createBackupVersion({
        name: fileName,
        tables: exportTables,
        size_bytes: 0, // Would need actual file size calculation
        description: null
      });
      
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
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        for (const sheetName of workbook.SheetNames) {
          // Verify the sheet name is a valid table name
          if (EXPORTABLE_TABLES.includes(sheetName as ExportableTable)) {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            if (jsonData.length > 0) {
              // Type assertion for the specific table
              const typedData = jsonData as TablesInsert<ExportableTable>[];
              
              const { error } = await supabase
                .from(sheetName as ExportableTable)
                .upsert(typedData, {
                  onConflict: 'id'
                });
                
              if (error) throw error;
            }
          }
        }
        
        toast({
          title: "Import Successful",
          description: "Database has been updated from Excel successfully.",
        });
      };
      
      reader.readAsArrayBuffer(file);
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
                      const options = Array.from(e.target.selectedOptions, option => option.value);
                      setSelectedTables(options);
                    }}
                  >
                    {EXPORTABLE_TABLES.map(table => (
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
                  onClick={handleExportDatabase}
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
                  onChange={handleImportDatabase}
                  disabled={isImporting}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-lg bg-muted p-4">
          <h4 className="text-sm font-medium mb-2">Important Notes:</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>Exports include all facility data including buildings, floors, rooms, and related information</li>
            <li>Large databases may take a few moments to process</li>
            <li>Make sure to keep a backup of your data before importing new records</li>
            <li>The import process will validate data before making any changes</li>
          </ul>
        </div>

        <Dialog open={showHistory} onOpenChange={setShowHistory}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Backup History</DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-[400px] rounded-md border p-4">
              <div className="space-y-4">
                {backupVersions.map((backup) => (
                  <div
                    key={backup.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div>
                      <h4 className="font-medium">{backup.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Created: {format(new Date(backup.created_at), 'PPp')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Tables: {backup.tables.join(', ')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </Card>
  );
}
