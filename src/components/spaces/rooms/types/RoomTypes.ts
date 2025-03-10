
import { StatusEnum, RoomTypeEnum, StorageTypeEnum, RoomTypeString, StorageTypeString } from "./roomEnums";

export type RoomType = RoomTypeEnum | RoomTypeString;
export type StorageType = StorageTypeEnum | StorageTypeString;

export interface RoomConnection {
  id: string;
  from_space_id?: string; // Optional since it might be missing from server response
  to_space_id: string;
  connection_type: string;
  direction?: string | null;
  status: string;
  to_space?: {
    id: string;
    name: string;
    type: string;
  } | null;
}

export interface Room {
  id: string;
  name: string;
  room_number: string;
  room_type: RoomType;
  status: StatusEnum | string;
  description?: string | null;
  phone_number?: string | null;
  is_storage: boolean;
  storage_type?: StorageType | null;
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
  
  floor?: {
    id: string;
    name: string;
    building?: {
      id: string;
      name: string;
    }
  };
  space_connections?: RoomConnection[];
  
  // Additional properties needed by components
  lighting_fixture?: any;
  current_occupants?: any[];
  issues?: any[];
  room_history?: any[];
  capacity?: number;
  current_occupancy?: number;
}
