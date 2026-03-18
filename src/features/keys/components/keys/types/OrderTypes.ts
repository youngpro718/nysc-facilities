
import { KeyType } from './KeyTypes';

// Match actual database enum values
export type KeyOrderStatus = 
  | 'pending_fulfillment' 
  | 'in_progress' 
  | 'ready_for_pickup' 
  | 'completed' 
  | 'received' 
  | 'cancelled';

export type KeyOrderPriority = 'low' | 'medium' | 'high' | 'urgent';

// Match actual database schema
export interface KeyOrder {
  id: string;
  key_id: string | null;
  request_id: string | null;
  user_id: string | null;
  requestor_id: string | null;
  recipient_id: string | null;
  quantity: number;
  status: KeyOrderStatus;
  priority: KeyOrderPriority | null;
  notes: string | null;
  ordered_by: string | null;
  ordered_at: string | null;
  expected_delivery_date: string | null;
  estimated_delivery_date: string | null;
  received_at: string | null;
  received_by: string | null;
  delivered_at: string | null;
  delivered_by: string | null;
  tracking_number: string | null;
  vendor_order_id: string | null;
  cost: number | null;
  delivery_notes: string | null;
  last_status_change: string | null;
  created_at: string | null;
  updated_at: string | null;
  // Joined data from views
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  reason?: string | null;
  request_type?: string | null;
}

export interface CreateKeyOrderData {
  key_id: string;
  quantity: number;
  recipient_id?: string;
  expected_delivery_date?: string;
  notes?: string;
}

export interface KeyOrderItem {
  id: string;
  order_id: string;
  quantity_ordered: number;
  quantity_received: number;
  created_at: string;
}

export interface ReceiveKeysData {
  order_id: string;
  quantity_received: number;
}
