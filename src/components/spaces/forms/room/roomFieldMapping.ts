import { RoomFormData } from "./RoomFormSchema";
import { 
  stringToRoomType, 
  stringToStatus, 
  stringToStorageType,
  roomTypeToString,
  statusToString,
  storageTypeToString,
  RoomTypeEnum,
  StatusEnum,
  StorageTypeEnum
} from "../../rooms/types/roomEnums";

// Database room type (what comes from Supabase)
export interface DatabaseRoom {
  id: string;
  name: string;
  room_number?: string;
  room_type: string;
  description?: string;
  status: string;
  floor_id: string;
  is_storage?: boolean;
  storage_capacity?: number;
  storage_type?: string;
  storage_notes?: string;
  phone_number?: string;
  current_function?: string;
  parent_room_id?: string;
  courtroom_photos?: {
    judge_view?: string;
    audience_view?: string;
  };
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  rotation?: number;
}

// Convert database room data to form data
export function dbToFormRoom(dbRoom: Partial<DatabaseRoom>, roomId?: string): Partial<RoomFormData> {
  if (!dbRoom) {
    return {
      id: roomId,
      name: "",
      floorId: "",
      roomType: RoomTypeEnum.OFFICE,
      status: StatusEnum.ACTIVE,
      isStorage: false,
      connections: [],
      position: { x: 0, y: 0 },
      size: { width: 150, height: 100 },
      rotation: 0,
      type: "room" as const,
    };
  }

  return {
    id: dbRoom.id || roomId,
    name: dbRoom.name || "",
    floorId: dbRoom.floor_id || "",
    roomNumber: dbRoom.room_number || "",
    roomType: dbRoom.room_type ? stringToRoomType(dbRoom.room_type) : RoomTypeEnum.OFFICE,
    status: dbRoom.status ? stringToStatus(dbRoom.status) : StatusEnum.ACTIVE,
    description: dbRoom.description || "",
    phoneNumber: dbRoom.phone_number || "",
    currentFunction: dbRoom.current_function || "",
    isStorage: dbRoom.is_storage || false,
    storageType: dbRoom.storage_type ? stringToStorageType(dbRoom.storage_type) : null,
    storageCapacity: dbRoom.storage_capacity || null,
    storageNotes: dbRoom.storage_notes || "",
    parentRoomId: dbRoom.parent_room_id || null,
    courtroom_photos: dbRoom.courtroom_photos || null,
    connections: [], // This would need to be fetched separately
    position: dbRoom.position || { x: 0, y: 0 },
    size: dbRoom.size || { width: 150, height: 100 },
    rotation: dbRoom.rotation || 0,
    type: "room" as const,
  };
}

// Convert form data to database format
export function formToDbRoom(formData: RoomFormData): Partial<DatabaseRoom> {
  return {
    id: formData.id,
    name: formData.name,
    room_number: formData.roomNumber || null,
    room_type: roomTypeToString(formData.roomType),
    description: formData.description || null,
    status: statusToString(formData.status),
    floor_id: formData.floorId,
    is_storage: formData.isStorage || false,
    storage_capacity: formData.storageCapacity || null,
    storage_type: formData.storageType ? storageTypeToString(formData.storageType) : null,
    storage_notes: formData.storageNotes || null,
    phone_number: formData.phoneNumber || null,
    current_function: formData.currentFunction || null,
    parent_room_id: formData.parentRoomId || null,
    courtroom_photos: formData.courtroom_photos || null,
    position: formData.position || { x: 0, y: 0 },
    size: formData.size || { width: 150, height: 100 },
    rotation: formData.rotation || 0,
  };
}