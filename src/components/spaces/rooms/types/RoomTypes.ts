
import { RoomTypeEnum, StatusEnum, StorageTypeEnum } from './roomEnums';

export interface CourtroomPhotos {
  judge_view?: string | null;
  audience_view?: string | null;
}

export interface Room {
  id: string;
  name: string;
  room_number?: string;
  room_type: RoomTypeEnum;
  status: StatusEnum;
  description?: string;
  phone_number?: string;
  is_storage?: boolean;
  storage_type?: StorageTypeEnum | null;
  storage_capacity?: number | null;
  storage_notes?: string;
  parent_room_id?: string | null;
  current_function?: string;
  floor_id: string;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  rotation?: number;
  courtroom_photos?: CourtroomPhotos | null;
  created_at: string;
  updated_at: string;
  // Additional properties that may be needed by some components
  floor?: {
    name: string;
    building: {
      name: string;
    };
  };
  current_occupants?: any[];
  issues?: any[];
  space_connections?: any[];
}

// Legacy type alias for backward compatibility
export type RoomType = Room;

export interface RoomConnection {
  id: string;
  from_room_id: string;
  to_room_id: string;
  connection_type: string;
  status: string;
}
