
import { StatusEnum, RoomTypeEnum, StorageTypeEnum } from "../../../rooms/types/roomEnums";
import type { Room } from "../../../types/RoomTypes";

interface RawRoomData {
  id: string;
  name: string;
  room_number?: string;
  room_type: string;
  status: string;
  floor_id: string;
  description?: string;
  phone_number?: string;
  is_storage?: boolean;
  storage_type?: string;
  storage_capacity?: number;
  current_function?: string;
  parent_room_id?: string;
  courtroom_photos?: any;
  floors?: {
    id: string;
    name: string;
    buildings?: {
      id: string;
      name: string;
    };
  };
}

export function transformRoomData(
  roomsData: RawRoomData[],
  fixturesByRoomId: Record<string, any[]>,
  issuesByRoomId: Record<string, any[]>,
  historyByRoomId: Record<string, any[]>,
  occupantsByRoomId: Record<string, any[]>,
  connectionsByRoomId: Record<string, any[]>
): Room[] {
  return roomsData.map(room => ({
    id: room.id,
    name: room.name,
    roomNumber: room.room_number || '',
    roomType: room.room_type as RoomTypeEnum,
    description: room.description || '',
    status: room.status as StatusEnum,
    floorId: room.floor_id,
    floorName: room.floors?.name || '',
    buildingName: room.floors?.buildings?.name || '',
    buildingId: room.floors?.buildings?.id || '',
    isStorage: room.is_storage || false,
    storageType: room.storage_type as StorageTypeEnum,
    storageCapacity: room.storage_capacity,
    phoneNumber: room.phone_number,
    currentFunction: room.current_function,
    parentRoomId: room.parent_room_id,
    courtroom_photos: room.courtroom_photos ? (typeof room.courtroom_photos === 'string' ? JSON.parse(room.courtroom_photos) : room.courtroom_photos) : null,
    occupants: occupantsByRoomId[room.id] || [],
    issues: issuesByRoomId[room.id] || [],
    history: historyByRoomId[room.id] || [],
    lightingFixtures: fixturesByRoomId[room.id] || [],
    connections: connectionsByRoomId[room.id] || []
  }));
}
