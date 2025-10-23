import { supabase } from "@/lib/supabase";
import { ExportableTable } from "../backupUtils";
import { parseExcelFile } from "@/utils/excelExport";
import ExcelJS from 'exceljs';

export async function importDatabase(file: File, exportableTables: readonly ExportableTable[]) {
  const workbook = new ExcelJS.Workbook();
  const arrayBuffer = await file.arrayBuffer();
  await workbook.xlsx.load(arrayBuffer);
  
  for (const worksheet of workbook.worksheets) {
    const sheetName = worksheet.name;
    
    // Verify the sheet name is a valid table name
    if (exportableTables.includes(sheetName as ExportableTable)) {
      const jsonData: any[] = [];
      const headers: string[] = [];
      
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
          // First row is headers
          row.eachCell(cell => {
            headers.push(cell.value?.toString() || '');
          });
        } else {
          // Data rows
          const rowData: any = {};
          row.eachCell((cell, colNumber) => {
            const header = headers[colNumber - 1];
            if (header) {
              rowData[header] = cell.value;
            }
          });
          jsonData.push(rowData);
        }
      });
      
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
