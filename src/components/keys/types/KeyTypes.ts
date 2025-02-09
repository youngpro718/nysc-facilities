
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
  building?: { name: string } | null;
  floor?: { name: string } | null;
  door?: { name: string } | null;
  room?: { name: string } | null;
  key_door_locations?: { door_location: string }[];
  key_assignments?: { id: string }[];
  door_location?: string;
  current_assignments?: number;
  key_scope: 'door' | 'room';
  room_id?: string | null;
  door_id?: string | null;
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

export interface StockTransaction {
  id: string;
  transaction_type: 'add' | 'remove';
  quantity: number;
  reason?: string;
  notes?: string;
  created_at: string;
  performed_by: string;
  profiles: { username: string };
}
