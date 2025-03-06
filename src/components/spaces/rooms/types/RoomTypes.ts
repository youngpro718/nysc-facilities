export type StatusEnum = 'active' | 'inactive' | 'maintenance' | 'construction';

export type RoomType = 
  'office' | 
  'conference_room' | 
  'storage' | 
  'server_room' | 
  'restroom' | 
  'kitchen' | 
  'reception' | 
  'lobby' | 
  'courtroom' | 
  'judges_chambers' | 
  'jury_room' | 
  'waiting_area' | 
  'archive' |
  'security' |
  'electrical_room' |
  'mechanical_room';

export type StorageType =
  'file_storage' |
  'equipment_storage' |
  'secure_storage' |
  'archive' |
  'general_purpose';

export interface LightingFixture {
  id: string;
  type: string;
  status: string;
  technology: string;
  electrical_issues: Record<string, any>;
  ballast_issue: boolean;
  maintenance_notes: string;
}

export interface RoomIssue {
  id: string;
  title: string;
  status: string;
  type: string;
  priority: string;
  created_at: string;
}

export interface RoomConnection {
  id: string;
  connection_type: string;
  direction?: string | null;
  from_space_id: string;
  to_space_id: string;
  to_space?: {
    id: string;
    name: string;
    type: string;
  } | null;
}

export interface ParentRoom {
  name: string;
}

export interface Room {
  id: string;
  name: string;
  room_number?: string;
  room_type: RoomType;
  description?: string;
  status: StatusEnum;
  floor_id: string;
  parent_room_id?: string | null;
  parent_room?: ParentRoom | null;
  is_storage: boolean;
  storage_capacity?: number | null;
  storage_type?: StorageType | null;
  storage_notes?: string | null;
  phone_number?: string | null;
  created_at: string;
  current_function?: string | null;
  function_change_date?: string | null;
  previous_functions?: any[] | null;
  
  // Related data
  lighting_fixture?: LightingFixture | null;
  issues?: RoomIssue[];
  space_connections: RoomConnection[];
  room_history: any[];
  current_occupants: any[];
  
  // Nested data from joins
  floor?: {
    id: string;
    name: string;
    building?: {
      id: string;
      name: string;
    }
  }
  
  // Keep the original floors property as well for backward compatibility
  floors?: {
    id: string;
    name: string;
    buildings: {
      id: string;
      name: string;
    }
  }
}
