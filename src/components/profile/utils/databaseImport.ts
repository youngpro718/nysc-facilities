
import * as XLSX from 'xlsx';
import { supabase } from "@/lib/supabase";
import { ExportableTable } from "../backupUtils";
// Remove the problematic import for now - we'll handle it without strict typing
// import type { TablesInsert } from "@/types/supabase";

export async function importDatabase(file: File, exportableTables: readonly ExportableTable[]) {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  
  for (const sheetName of workbook.SheetNames) {
    // Verify the sheet name is a valid table name
    if (exportableTables.includes(sheetName as ExportableTable)) {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      if (jsonData.length > 0) {
        // Type assertion for the specific table
        const typedData = jsonData as any[];
        
        const { error } = await supabase
          .from(sheetName as ExportableTable)
          .upsert(typedData, {
            onConflict: 'id'
          });
          
        if (error) throw error;
      }
    }
  }
}
