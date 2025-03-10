
import { Room, RoomType, StorageType } from "../../../rooms/types/RoomTypes";

export const transformRoomData = (
  roomsData: any[],
  fixturesByRoomId: Record<string, any>,
  issuesByRoomId: Record<string, any[]>,
  historyByRoomId: Record<string, any[]>,
  occupantsByRoomId: Record<string, any[]>,
  connectionsByRoomId: Record<string, any[]>
): Room[] => {
  return roomsData.map(room => ({
    ...room,
    room_type: room.room_type as RoomType,
    storage_type: room.storage_type ? (room.storage_type as StorageType) : null,
    // Ensure position and size are in the expected format
    position: typeof room.position === 'object' ? room.position : 
      (room.position ? (typeof room.position === 'string' ? JSON.parse(room.position) : { x: 0, y: 0 }) : { x: 0, y: 0 }),
    size: typeof room.size === 'object' ? room.size : 
      (room.size ? (typeof room.size === 'string' ? JSON.parse(room.size) : { width: 150, height: 100 }) : { width: 150, height: 100 }),
    // Convert courtroom_photos from Json if needed
    courtroom_photos: typeof room.courtroom_photos === 'object' ? room.courtroom_photos :
      (room.courtroom_photos ? (typeof room.courtroom_photos === 'string' ? JSON.parse(room.courtroom_photos) : null) : null),
    // Process relationships and related data
    lighting_fixture: fixturesByRoomId[room.id] ? {
      id: fixturesByRoomId[room.id].id,
      type: fixturesByRoomId[room.id].type,
      status: fixturesByRoomId[room.id].status,
      technology: fixturesByRoomId[room.id].technology,
      electrical_issues: fixturesByRoomId[room.id].electrical_issues,
      ballast_issue: fixturesByRoomId[room.id].ballast_issue,
      maintenance_notes: fixturesByRoomId[room.id].maintenance_notes
    } : null,
    space_connections: (connectionsByRoomId[room.id] || []).map(conn => ({
      id: conn.id,
      from_space_id: conn.from_space_id || room.id, // Ensure from_space_id is set 
      to_space_id: conn.to_space_id,
      connection_type: conn.connection_type,
      direction: conn.direction,
      status: conn.status,
      to_space: conn.to_space
    })),
    issues: (issuesByRoomId[room.id] || []).map(issue => ({
      id: issue.id,
      title: issue.title,
      status: issue.status,
      type: issue.type,
      priority: issue.priority,
      created_at: issue.created_at
    })),
    room_history: historyByRoomId[room.id] || [],
    current_occupants: occupantsByRoomId[room.id] || [],
    // Add a floor property that matches the structure used in the components
    floor: room.floors ? {
      id: room.floors.id,
      name: room.floors.name,
      building: room.floors.buildings ? {
        id: room.floors.buildings.id,
        name: room.floors.buildings.name
      } : undefined
    } : undefined
  }));
};
