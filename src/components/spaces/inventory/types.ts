
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

export interface InventoryTransaction {
  id: string;
  item_id: string;
  transaction_type: 'add' | 'remove' | 'adjust' | 'transfer';
  quantity: number;
  from_room_id?: string;
  to_room_id?: string;
  notes?: string;
  created_at: string;
}

export interface InventoryAlert {
  id: string;
  item_id: string;
  alert_type: 'low_stock' | 'reorder' | 'expiry';
  threshold: number;
  enabled: boolean;
  notification_sent: boolean;
  last_notification_date?: string;
}
