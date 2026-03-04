import { EnhancedRoom } from "../types/EnhancedRoomTypes";

/**
 * Builds the initialData object for EditSpaceDialog from an EnhancedRoom.
 * Shared by CardFront and CardBack to avoid duplication.
 */
export function buildRoomInitialData(room: EnhancedRoom) {
  return {
    id: room.id,
    name: room.name,
    room_number: room.room_number || '',
    room_type: room.room_type,
    description: room.description || '',
    status: room.status,
    floor_id: room.floor_id,
    is_storage: room.is_storage || false,
    storage_type: room.storage_type || null,
    storage_capacity: room.storage_capacity || null,
    storage_notes: room.storage_notes || null,
    parent_room_id: room.parent_room_id || null,
    current_function: room.current_function || null,
    phone_number: room.phone_number || null,
    courtroom_photos: room.courtroom_photos || null,
    connections: room.space_connections?.map(conn => ({
      id: conn.id,
      connectionType: conn.connection_type,
      toSpaceId: conn.to_space_id,
      direction: conn.direction || null,
    })) || [],
    type: "room" as const,
  };
}
