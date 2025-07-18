
import * as XLSX from 'xlsx';
import { useToast } from "@/hooks/use-toast";

export interface InventoryExcelRow {
  name: string;
  quantity: number;
  category?: string;
  description?: string;
  minimum_quantity?: number;
  unit?: string;
  location_details?: string;
  preferred_vendor?: string;
  status?: string;
  notes?: string;
}

// Field mapping for flexible import
const FIELD_MAPPINGS: Record<string, string[]> = {
  'name': ['name', 'item_name', 'item', 'product_name'],
  'quantity': ['quantity', 'qty', 'amount', 'stock'],
  'minimum_quantity': ['minimum_quantity', 'min_quantity', 'minimum', 'min', 'reorder_level'],
  'category': ['category', 'category_name', 'type'],
  'description': ['description', 'desc', 'details'],
  'unit': ['unit', 'uom', 'measurement_unit'],
  'location_details': ['location_details', 'location', 'storage_location'],
  'preferred_vendor': ['preferred_vendor', 'vendor', 'supplier'],
  'status': ['status', 'state'],
  'notes': ['notes', 'comments', 'remarks']
};

// Normalize field names for flexible mapping
const normalizeFieldName = (fieldName: string): string => {
  const normalized = fieldName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  
  // Find matching field
  for (const [standardField, variations] of Object.entries(FIELD_MAPPINGS)) {
    if (variations.includes(normalized)) {
      return standardField;
    }
  }
  
  return normalized;
};

export const exportToExcel = (data: InventoryExcelRow[], fileName: string) => {
  try {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventory');
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw new Error('Failed to export to Excel');
  }
};

export const generateTemplate = () => {
  const template = [{
    name: "Sample Item",
    quantity: 10,
    minimum_quantity: 5,
    category: "General",
    description: "Sample description",
    unit: "pieces",
    location_details: "Shelf A1",
    preferred_vendor: "Sample Vendor",
    status: "active",
    notes: "Sample notes"
  }];
  
  exportToExcel(template, "inventory_import_template");
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
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });
        
        if (!jsonData || jsonData.length === 0) {
          throw new Error('No data found in Excel file');
        }
        
        // Process and validate data with flexible field mapping
        const processedData = jsonData.map((row: any, index: number) => {
          const normalizedRow: any = {};
          
          // Normalize field names
          for (const [key, value] of Object.entries(row)) {
            const normalizedKey = normalizeFieldName(key as string);
            normalizedRow[normalizedKey] = value;
          }
          
          // Validate required fields
          if (!normalizedRow.name || typeof normalizedRow.name !== 'string' || !normalizedRow.name.trim()) {
            throw new Error(`Row ${index + 1}: Name is required and must be a non-empty string`);
          }
          
          if (normalizedRow.quantity === undefined || normalizedRow.quantity === null || normalizedRow.quantity === '') {
            throw new Error(`Row ${index + 1}: Quantity is required`);
          }
          
          // Convert and validate quantity
          const quantity = Number(normalizedRow.quantity);
          if (isNaN(quantity) || quantity < 0) {
            throw new Error(`Row ${index + 1}: Quantity must be a non-negative number`);
          }
          
          // Convert and validate minimum_quantity if provided
          let minimumQuantity = null;
          if (normalizedRow.minimum_quantity !== undefined && normalizedRow.minimum_quantity !== null && normalizedRow.minimum_quantity !== '') {
            minimumQuantity = Number(normalizedRow.minimum_quantity);
            if (isNaN(minimumQuantity) || minimumQuantity < 0) {
              throw new Error(`Row ${index + 1}: Minimum quantity must be a non-negative number`);
            }
          }
          
          return {
            name: normalizedRow.name.trim(),
            quantity: quantity,
            minimum_quantity: minimumQuantity,
            category: normalizedRow.category ? normalizedRow.category.trim() : 'General',
            description: normalizedRow.description ? normalizedRow.description.trim() : null,
            unit: normalizedRow.unit ? normalizedRow.unit.trim() : null,
            location_details: normalizedRow.location_details ? normalizedRow.location_details.trim() : null,
            preferred_vendor: normalizedRow.preferred_vendor ? normalizedRow.preferred_vendor.trim() : null,
            status: normalizedRow.status ? normalizedRow.status.trim() : 'active',
            notes: normalizedRow.notes ? normalizedRow.notes.trim() : null,
          };
        });
        
        resolve(processedData);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};
