
export type KeyType = "physical_key" | "elevator_pass" | "room_key";
export type KeyStatus = "available" | "assigned" | "lost" | "decommissioned";
export type ReturnReason = "normal_return" | "lost" | "damaged" | "other";

export interface KeyFilterOptions {
  type?: KeyType | "all_types";
  captainOfficeCopy?: "all" | "has_copy" | "missing_copy";
}

export interface SortOption {
  field: 'name' | 'type' | 'status' | 'created_at';
  direction: 'asc' | 'desc';
}

export interface LocationData {
  building_id?: string;
  floor_id?: string;
  door_id?: string;
  room_id?: string;
}

export interface KeyProperties {
  notes?: string;
  manufacturer?: string;
  serial_number?: string;
  purchase_date?: string;
  warranty_expiry?: string;
  [key: string]: any;
}

export interface KeyData {
  id: string;
  name: string;
  type: KeyType;
  status: KeyStatus;
  total_quantity: number;
  available_quantity: number;
  is_passkey: boolean;
  key_scope: 'door' | 'room' | 'room_door';
  properties: KeyProperties;
  location_data: LocationData;
  captain_office_copy: boolean;
  captain_office_assigned_date?: string;
  captain_office_notes?: string;
  active_assignments: number;
  returned_assignments: number;
  lost_count: number;
  created_at?: string;
  updated_at?: string;
  // Backward compatibility fields
  assigned_count?: number;
  stock_status?: string;
}

export interface KeyFormData {
  name: string;
  type: KeyType;
  isPasskey: boolean;
  quantity: number;
  spareKeys: number;
  keyScope: 'door' | 'room' | 'room_door';
  buildingId?: string;
  floorId?: string;
  doorId?: string;
  roomId?: string;
  occupantId?: string;
}

export interface KeyAuditLog {
  id: string;
  key_id: string;
  action_type: string;
  performed_by: string;
  changes: Record<string, any>;
  created_at: string;
  username?: string;
  email?: string;
}

export interface StockTransaction {
  id: string;
  key_id: string;
  quantity: number;
  transaction_type: 'add' | 'remove' | 'adjustment';
  reason?: string;
  notes?: string;
  performed_by?: string;
  created_at: string;
}
