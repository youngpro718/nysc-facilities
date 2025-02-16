
import * as XLSX from 'xlsx';
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { ExportableTable, createBackupVersion } from "../backupUtils";

export async function exportDatabase(selectedTables: ExportableTable[], exportableTables: readonly ExportableTable[]) {
  const workbook = XLSX.utils.book_new();
  const exportTables = selectedTables.length > 0 ? selectedTables : [...exportableTables];
  
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

  return fileName;
}
