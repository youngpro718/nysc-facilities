
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
      (room.position ? JSON.parse(String(room.position)) : { x: 0, y: 0 }),
    size: typeof room.size === 'object' ? room.size : 
      (room.size ? JSON.parse(String(room.size)) : { width: 150, height: 100 }),
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
    space_connections: connectionsByRoomId[room.id] || [],
    courtroom_photos: room.courtroom_photos ? room.courtroom_photos : null,
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
