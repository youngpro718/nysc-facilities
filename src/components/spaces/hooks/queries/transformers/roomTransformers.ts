
import { Room } from "../../../rooms/types/RoomTypes";
import { LightingFixture } from "../../../rooms/types/roomEnums";

interface RawRoom {
  id: string;
  name: string;
  room_number: string;
  floor_id: string;
  status: string;
  type: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  room_properties?: {
    room_type: string;
    current_function: string | null;
    is_storage: boolean;
    storage_type: string | null;
    storage_capacity: number | null;
    phone_number: string | null;
    current_occupancy: number;
    parent_room_id: string | null;
  };
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
  rooms: RawRoom[],
  fixturesByRoomId: Record<string, LightingFixture[]>,
  issuesByRoomId: Record<string, any[]>,
  historyByRoomId: Record<string, any[]>,
  occupantsByRoomId: Record<string, any[]>
): Room[] {
  return rooms.map((room) => ({
    id: room.id,
    name: room.name,
    room_number: room.room_number,
    floor_id: room.floor_id,
    status: room.status,
    type: room.type,
    position: room.position,
    size: room.size,
    room_type: room.room_properties?.room_type || 'office',
    current_function: room.room_properties?.current_function || null,
    is_storage: room.room_properties?.is_storage || false,
    storage_type: room.room_properties?.storage_type || null,
    storage_capacity: room.room_properties?.storage_capacity || null,
    phone_number: room.room_properties?.phone_number || null,
    current_occupancy: room.room_properties?.current_occupancy || 0,
    parent_room_id: room.room_properties?.parent_room_id || null,
    floor: room.floors ? {
      id: room.floors.id,
      name: room.floors.name,
      building: room.floors.buildings ? {
        id: room.floors.buildings.id,
        name: room.floors.buildings.name
      } : undefined
    } : undefined,
    fixtures: fixturesByRoomId[room.id] || [],
    issues: issuesByRoomId[room.id] || [],
    history: historyByRoomId[room.id] || [],
    occupants: occupantsByRoomId[room.id] || []
  }));
}
