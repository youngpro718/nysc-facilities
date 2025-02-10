import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Database, Download, Upload } from "lucide-react";
import { useState } from "react";
import * as XLSX from 'xlsx';
import { TablesInsert } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";

const EXPORTABLE_TABLES = [
  'buildings', 'floors', 'rooms', 'occupants', 'keys',
  'key_assignments', 'lighting_fixtures', 'lighting_zones', 'issues'
] as const;

type ExportableTable = typeof EXPORTABLE_TABLES[number];

export function DatabaseSection() {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleExportDatabase = async () => {
    try {
      setIsExporting(true);
      
      const workbook = XLSX.utils.book_new();
      
      for (const table of EXPORTABLE_TABLES) {
        const { data, error } = await supabase
          .from(table)
          .select('*');
          
        if (error) throw error;
        
        // Create worksheet for each table
        const worksheet = XLSX.utils.json_to_sheet(data || []);
        XLSX.utils.book_append_sheet(workbook, worksheet, table);
      }
      
      // Generate Excel file
      XLSX.writeFile(workbook, 'database_export.xlsx');
      
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
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold">Database Management</h2>
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
                  Download a complete backup of the database as an Excel file. This includes all tables and their relationships.
                </p>
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
      </div>
    </Card>
  );
}
