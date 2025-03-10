
import { StatusEnum, RoomTypeEnum, StorageTypeEnum, RoomTypeString, StorageTypeString } from "./roomEnums";

export type RoomType = RoomTypeEnum | RoomTypeString;
export type StorageType = StorageTypeEnum | StorageTypeString;

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
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  rotation?: number;
  courtroom_photos?: {
    judge_view?: string | null;
    audience_view?: string | null;
  };
  
  floor?: {
    id: string;
    name: string;
    building?: {
      id: string;
      name: string;
    }
  };
  space_connections?: RoomConnection[];
}
