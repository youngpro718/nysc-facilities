
import * as XLSX from 'xlsx';
import { supabase } from "@/integrations/supabase/client";
import { ExportableTable } from "../backupUtils";
import { TablesInsert } from "@/integrations/supabase/types";

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
}
