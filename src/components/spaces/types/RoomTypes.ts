
import { StatusEnum, RoomTypeEnum, StorageTypeEnum } from "../rooms/types/roomEnums";

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

// Define the courtroom photos interface for reuse
export interface CourtroomPhotos {
  judge_view?: string | null;
  audience_view?: string | null;
}

export interface Room {
  id: string;
  name: string;
  room_number: string;
  room_type: RoomTypeEnum;
  status: StatusEnum;
  description?: string;
  floor_id: string;
  is_storage: boolean;
  storage_type?: StorageTypeEnum;
  storage_capacity?: number;
  storage_notes?: string;
  parent_room_id?: string;
  current_function?: string;
  phone_number?: string;
  created_at: string;
  updated_at: string;
  
  // Navigation properties
  floor?: {
    id: string;
    name: string;
    building?: {
      id: string;
      name: string;
    };
  };
  
  space_connections?: RoomConnection[];

  // Compatibility properties for legacy code
  roomType: RoomTypeEnum;
  roomNumber: string;
  floorId: string;
  floorName?: string;
  buildingName?: string;
  buildingId?: string;

  // Additional properties from rooms table
  function_change_date?: string;
  previous_functions?: any[];
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  rotation?: number;
  
  // Use the consistent CourtroomPhotos type
  courtroom_photos?: CourtroomPhotos | null;
  
  // Related data
  lighting_fixture?: any;
  issues?: any[];
  room_history?: any[];
  current_occupants?: any[];
}
