// @ts-nocheck
import { useToast } from "@/hooks/use-toast";
import { logger } from '@/lib/logger';
import { exportToExcel as exportToExcelUtil, sanitizeForExcel, parseExcelFile as parseExcelFileUtil } from "@/utils/excelExport";

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

export const exportToExcel = async (data: InventoryExcelRow[], fileName: string) => {
  try {
    const sanitized = data.map((row: Record<string, unknown>) =>
      Object.fromEntries(
        Object.entries(row).map(([k, v]) => [k, sanitizeForExcel(v)])
      )
    );
    await exportToExcelUtil(sanitized, fileName, 'Inventory');
  } catch (error) {
    logger.error('Error exporting to Excel:', error);
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
  try {
    const jsonData = await parseExcelFileUtil(file);
    
    if (!jsonData || jsonData.length === 0) {
      throw new Error('No data found in Excel file');
    }
    
    // Process and validate data with flexible field mapping
    const processedData = jsonData.map((row: Record<string, unknown>, index: number) => {
      const normalizedRow: Record<string, unknown> = {};
      
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
    
    return processedData;
  } catch (error) {
    throw error;
  }
};
