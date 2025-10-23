import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { ExportableTable, createBackupVersion } from "../backupUtils";
import { exportMultipleSheets, sanitizeForExcel } from "@/utils/excelExport";

export async function exportDatabase(selectedTables: ExportableTable[], exportableTables: readonly ExportableTable[]) {
  const exportTables = selectedTables.length > 0 ? selectedTables : [...exportableTables];
  const sheets: Array<{ name: string; data: any[] }> = [];
  
  for (const table of exportTables) {
    const { data, error } = await supabase
      .from(table)
      .select('*');
      
    if (error) throw error;
    
    // Sanitize data for Excel export
    const sanitized = (data || []).map((row: any) =>
      Object.fromEntries(
        Object.entries(row).map(([k, v]) => [k, sanitizeForExcel(v)])
      )
    );
    
    sheets.push({
      name: table.substring(0, 31), // Excel sheet name limit
      data: sanitized
    });
  }
  
  // Generate Excel file using secure ExcelJS
  const fileName = `database_export_${format(new Date(), 'yyyy-MM-dd_HH-mm')}`;
  await exportMultipleSheets(sheets, fileName);

  // Record backup version
  await createBackupVersion({
    name: `${fileName}.xlsx`,
    tables: exportTables,
    size_bytes: 0, // Would need actual file size calculation
    description: null
  });

  return `${fileName}.xlsx`;
}

