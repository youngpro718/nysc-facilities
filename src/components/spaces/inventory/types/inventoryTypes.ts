
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
  previous_quantity: number;
  new_quantity: number;
  performed_by?: string;
  notes?: string;
  created_at: string;
}
