
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

export interface InventoryFormInputs {
  name: string;
  description?: string;
  quantity: number;
  minimum_quantity?: number;
  unit?: string;
  category_id: string;
  location_details?: string;
  preferred_vendor?: string;
  notes?: string;
  photo_url?: string;
}

export interface BatchUpdateInput {
  items: Array<{
    id: string;
    quantity: number;
  }>;
  notes?: string;
}
