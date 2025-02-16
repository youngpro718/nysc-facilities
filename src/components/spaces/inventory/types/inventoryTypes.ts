
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

export interface InventoryCategory {
  id: string;
  name: string;
  color: string;
  icon?: string;
  description?: string;
  parent_category_id?: string;
}

export interface InventoryTransaction {
  id: string;
  transaction_type: 'add' | 'remove' | 'transfer';
  quantity: number;
  created_at: string;
  inventory_items?: {
    id: string;
    name: string;
  };
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

export interface BatchUpdateInput {
  items: { id: string; quantity: number }[];
  notes?: string;
}
