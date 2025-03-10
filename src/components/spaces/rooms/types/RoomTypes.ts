
import { StatusEnum, RoomTypeEnum, StorageTypeEnum } from "./roomEnums";

export type RoomType = keyof typeof RoomTypeEnum | string;
export type StorageType = keyof typeof StorageTypeEnum | string;

export interface RoomConnection {
  id: string;
  from_space_id: string;
  to_space_id: string;
  connection_type: string;
  direction?: string | null;
  status: string;
  to_space?: {
    id: string;
    name: string;
    type: string;
  };
}

export interface Room {
  id: string;
  name: string;
  room_number: string;
  room_type: RoomType | string;
  status: StatusEnum | string;
  description?: string | null;
  phone_number?: string | null;
  is_storage: boolean;
  storage_type?: StorageType | string | null;
  storage_capacity?: number | null;
  storage_notes?: string | null;
  parent_room_id?: string | null;
  current_function?: string | null;
  floor_id: string;
  created_at: string;
  updated_at: string;
  function_change_date?: string;
  previous_functions?: any[];
  position?: { x: number; y: number } | any;
  size?: { width: number; height: number } | any;
  rotation?: number;
  courtroom_photos?: {
    judge_view?: string | null;
    audience_view?: string | null;
  } | any;
  
  // Relationships
  floor?: {
    id: string;
    name: string;
    building?: {
      id: string;
      name: string;
    }
  };
  
  // Related data
  lighting_fixture?: any;
  space_connections?: RoomConnection[];
  issues?: any[];
  room_history?: any[];
  current_occupants?: any[];
}
