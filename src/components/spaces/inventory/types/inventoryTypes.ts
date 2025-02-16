
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

export interface InventoryFormInputs {
  name: string;
  quantity: number;
  category_id: string;
  description?: string;
  minimum_quantity?: number;
  unit?: string;
  location_details?: string;
  reorder_point?: number;
  preferred_vendor?: string;
  notes?: string;
}

export interface InventoryTransactionType {
  id: string;
  item_id: string;
  transaction_type: 'add' | 'remove' | 'transfer';
  quantity: number;
  from_room_id?: string;
  to_room_id?: string;
  performed_by?: string;
  notes?: string;
  created_at: string;
}

export interface LowStockItem {
  id: string;
  name: string;
  quantity: number;
  minimum_quantity: number;
  category_id: string;
  category_name: string;
  room_id: string;
  room_name: string;
  storage_location: string;
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
