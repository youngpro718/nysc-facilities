
export interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  minimum_quantity?: number;
  unit?: string;
  category_id?: string;
  storage_room_id: string;
  location_details?: string;
  status: string;
  last_inventory_date?: string;
  preferred_vendor?: string;
  reorder_point?: number;
  notes?: string;
  photo_url?: string;
  created_at?: string;
  updated_at?: string;
  category?: {
    id: string;
    name: string;
    color: string;
    icon?: string;
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
