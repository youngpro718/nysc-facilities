
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
  category?: {
    id: string;
    name: string;
    color: string;
    icon?: string;
  };
}

export interface InventoryCategory {
  id: string;
  name: string;
  color: string;
  icon?: string;
  description?: string;
}

export interface InventoryTransaction {
  id: string;
  item_id: string;
  transaction_type: 'add' | 'remove' | 'adjust';
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  performed_by?: string;
  notes?: string;
  created_at: string;
}
