 
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

// Sanitize string values to prevent Excel from interpreting text as formulas
const sanitizeForExcel = (value: any) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (/^[=+\-@]/.test(trimmed) || /^[\t\r]/.test(value)) {
    return "'" + value;
  }
  return value;
};

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
    const sanitized = data.map((row: any) =>
      Object.fromEntries(
        Object.entries(row).map(([k, v]) => [k, sanitizeForExcel(v)])
      )
    );
    const ws = XLSX.utils.json_to_sheet(sanitized);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventory');
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw new Error('Failed to export to Excel');
  }
};

export const generateTemplate = () => {
  const template = [
    {
      name: "Sample Office Supplies",
      quantity: 50,
      minimum_quantity: 10,
      category: "Office Supplies",
      description: "Pens, pencils, and paper supplies",
      unit: "pieces",
      location_details: "Supply Room A, Shelf 1",
      preferred_vendor: "Office Depot",
      status: "active",
      notes: "Bulk purchase recommended"
    },
    {
      name: "Computer Monitor",
      quantity: 5,
      minimum_quantity: 2,
      category: "Electronics", 
      description: "24-inch LED monitors",
      unit: "units",
      location_details: "IT Storage Room",
      preferred_vendor: "Best Buy Business",
      status: "active",
      notes: "Dell brand preferred"
    },
    {
      name: "Cleaning Supplies",
      quantity: 25,
      minimum_quantity: 5,
      category: "Maintenance",
      description: "All-purpose cleaner and disinfectant",
      unit: "bottles",
      location_details: "Janitor Closet B",
      preferred_vendor: "Facility Solutions",
      status: "active",
      notes: "Eco-friendly products only"
    }
  ];
  
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
            category: normalizedRow.category ? normalizedRow.category.trim() : null,
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
