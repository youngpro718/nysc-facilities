
import { Room, RoomType, StorageType } from "../../../rooms/types/RoomTypes";

export const transformRoomData = (
  roomsData: any[],
  fixturesByRoomId: Record<string, any>,
  issuesByRoomId: Record<string, any[]>,
  historyByRoomId: Record<string, any[]>,
  occupantsByRoomId: Record<string, any[]>
): Room[] => {
  return roomsData.map(room => {
    // Get the room properties from the nested room_properties array
    const roomProps = room.room_properties?.[0] || {};

    return {
      id: room.id,
      name: room.name,
      room_number: room.room_number || '',
      room_type: (roomProps.room_type || 'office') as RoomType,
      description: room.description,
      status: room.status,
      floor_id: room.floor_id,
      parent_room_id: roomProps.parent_room_id,
      is_storage: roomProps.is_storage || false,
      storage_capacity: roomProps.storage_capacity,
      storage_type: roomProps.storage_type as StorageType | null,
      storage_notes: room.storage_notes,
      phone_number: roomProps.phone_number,
      created_at: room.created_at,
      current_function: roomProps.current_function,
      function_change_date: roomProps.function_change_date,
      floor: room.floor,
      parent_room: roomProps.parent_room_id ? { name: '' } : undefined, // This would need to be fetched separately if needed
      space_connections: [], // This would need to be fetched separately if needed
      lighting_fixture: fixturesByRoomId[room.id] ? {
        id: fixturesByRoomId[room.id].id,
        type: fixturesByRoomId[room.id].type,
        status: fixturesByRoomId[room.id].status,
        technology: fixturesByRoomId[room.id].technology,
        electrical_issues: fixturesByRoomId[room.id].electrical_issues,
        ballast_issue: fixturesByRoomId[room.id].ballast_issue,
        maintenance_notes: fixturesByRoomId[room.id].maintenance_notes
      } : null,
      issues: (issuesByRoomId[room.id] || []).map(issue => ({
        id: issue.id,
        title: issue.title,
        status: issue.status,
        type: issue.type,
        priority: issue.priority,
        created_at: issue.created_at
      })),
      room_history: historyByRoomId[room.id] || [],
      current_occupants: occupantsByRoomId[room.id] || []
    };
  });
};
