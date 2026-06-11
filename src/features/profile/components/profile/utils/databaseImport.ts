import { supabase } from "@/lib/supabase";
import { ExportableTable } from "../backupUtils";
import { parseExcelFile, sheetToJson } from "@shared/utils/excelExport";

export async function importDatabase(file: File, exportableTables: readonly ExportableTable[]) {
  // ExcelJS is loaded on demand to keep it out of route bundles
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  const arrayBuffer = await file.arrayBuffer();
  await workbook.xlsx.load(arrayBuffer);

  for (const worksheet of workbook.worksheets) {
    const sheetName = worksheet.name;

    // Verify the sheet name is a valid table name
    if (exportableTables.includes(sheetName as ExportableTable)) {
      const jsonData = sheetToJson(worksheet);

      if (jsonData.length > 0) {
        const { error } = await supabase
          .from(sheetName as ExportableTable)
          .upsert(jsonData, {
            onConflict: 'id'
          });
          
        if (error) throw error;
      }
    }
  }
}
