
export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  category_id: string;
  description?: string;
  minimum_quantity?: number;
  unit?: string;
  status: string;
  location_details?: string;
  last_inventory_date?: string;
  reorder_point?: number;
  preferred_vendor?: string;
  notes?: string;
  category?: {
    name: string;
    color: string;
    icon?: string;
    description?: string;
  };
}

export interface DatabaseInventoryItem {
  id: string;
  name: string;
  quantity: number;
  category_id: string;
  description?: string;
  minimum_quantity?: number;
  unit?: string;
  status: string;
  location_details?: string;
  last_inventory_date?: string;
  reorder_point?: number;
  preferred_vendor?: string;
  notes?: string;
  category_name: string;
  category_color: string;
  category_icon?: string;
  category_description?: string;
}

export interface RawLowStockData {
  id: string;
  name: string;
  quantity: number;
  minimum_quantity: number;
  category_id: string;
  category_name: string;
  room_name: string | null;
  storage_location: string | null;
  room_id: string;
}
