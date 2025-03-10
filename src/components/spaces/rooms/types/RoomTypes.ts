
import { StatusEnum, RoomTypeEnum, StorageTypeEnum } from "./roomEnums";

export type RoomType = RoomTypeEnum;
export type StorageType = StorageTypeEnum;

export interface Room {
  id: string;
  name: string;
  room_number: string;
  room_type: RoomType;
  status: StatusEnum;
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
  space_connections?: any[];
  issues?: any[];
  room_history?: any[];
  current_occupants?: any[];
}
