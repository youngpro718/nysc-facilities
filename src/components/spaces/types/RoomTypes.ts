
import { StatusEnum, RoomTypeEnum, StorageTypeEnum } from "../rooms/types/roomEnums";

export interface Room {
  id: string;
  name: string;
  room_number: string;
  room_type: RoomTypeEnum;
  status: StatusEnum;
  description?: string;
  floor_id: string;
  is_storage?: boolean;
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
  
  space_connections?: Array<{
    id: string;
    connection_type: string;
    to_space_id: string;
    direction?: string;
  }>;

  // Compatibility properties for legacy code
  roomType: RoomTypeEnum;
  roomNumber: string;
  floorId: string;
  floorName?: string;
  buildingName?: string;
  buildingId?: string;
}
