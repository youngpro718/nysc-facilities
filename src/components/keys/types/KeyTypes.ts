
export type KeyType = "physical_key" | "elevator_pass" | "room_key";
export type KeyStatus = "available" | "assigned" | "lost" | "decommissioned";
export type ReturnReason = "normal_return" | "lost" | "damaged" | "other";

export interface KeyFilters {
  type?: KeyType | "all_types";
  status?: KeyStatus | "all_statuses";
  building_id?: string | "all_buildings";
}

export interface SortOption {
  field: 'name' | 'type' | 'status' | 'created_at';
  direction: 'asc' | 'desc';
}

export interface KeyData {
  id: string;
  name: string;
  type: KeyType;
  status: KeyStatus;
  total_quantity: number;
  available_quantity: number;
  is_passkey: boolean;
  key_scope: 'door' | 'room';
  properties: Record<string, any>;
  location_data: {
    building_id?: string;
    floor_id?: string;
    door_id?: string;
    room_id?: string;
  };
  active_assignments: number;
  returned_assignments: number;
  lost_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface KeyDoorLocation {
  id: string;
  key_id: string;
  key_name: string;
  door_id: string;
  door_name: string;
  floor_id: string;
  floor_name: string;
  building_id: string;
  building_name: string;
}

export interface KeyFormData {
  name: string;
  type: KeyType;
  isPasskey: boolean;
  quantity: number;
  spareKeys: number;
  keyScope: 'door' | 'room';
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

export interface KeyDoorLocationInsert {
  key_id: string;
  door_id: string;
}
