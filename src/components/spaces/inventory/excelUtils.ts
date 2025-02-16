
import * as XLSX from 'xlsx';
import { toast } from "@/hooks/use-toast";

export interface InventoryExcelRow {
  name: string;
  quantity: number;
  category: string;
  description?: string;
  minimum_quantity?: number;
  unit?: string;
}

export const exportToExcel = (data: InventoryExcelRow[], fileName: string) => {
  try {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventory');
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    toast({
      title: "Export Failed",
      description: "Failed to export inventory data to Excel.",
      variant: "destructive",
    });
  }
};

export const parseExcelFile = async (file: File): Promise<InventoryExcelRow[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as InventoryExcelRow[];
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};
