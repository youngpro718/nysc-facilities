
import { KeyType } from './KeyTypes';

export type KeyOrderStatus = 'ordered' | 'partially_received' | 'received' | 'canceled';

export interface KeyOrder {
  id: string;
  key_id: string;
  key_name: string;
  key_type: KeyType;
  quantity: number;
  ordered_at: string;
  expected_delivery_date: string | null;
  received_at: string | null;
  status: KeyOrderStatus;
  notes: string | null;
  requestor_id: string | null;
  requestor_email: string | null;
  requestor_name: string | null;
  recipient_id: string | null;
  recipient_name: string | null;
  recipient_department: string | null;
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
