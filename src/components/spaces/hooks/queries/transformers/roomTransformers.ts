
import { Room } from "../../../rooms/types/RoomTypes";
import { LightingFixture, RoomType } from "../../../rooms/types/roomEnums";

interface RawRoom {
  id: string;
  name: string;
  room_number: string;
  floor_id: string;
  status: string;
  type: string;
  position: { x: number; y: number } | string;
  size: { width: number; height: number } | string;
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
  return rooms.map((room) => {
    // Parse position and size if they're strings
    const position = typeof room.position === 'string' ? 
      JSON.parse(room.position) : room.position;
    const size = typeof room.size === 'string' ? 
      JSON.parse(room.size) : room.size;

    // Convert room_type string to enum
    const roomType = (room.room_properties?.room_type || 'office').toUpperCase() as keyof typeof RoomType;
    const convertedRoomType = RoomType[roomType] || RoomType.OFFICE;

    return {
      id: room.id,
      name: room.name,
      room_number: room.room_number,
      floor_id: room.floor_id,
      status: room.status as "active" | "inactive" | "under_maintenance",
      type: room.type,
      position: position,
      size: size,
      created_at: new Date().toISOString(),
      space_connections: [],
      room_type: convertedRoomType,
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
    };
  });
}
