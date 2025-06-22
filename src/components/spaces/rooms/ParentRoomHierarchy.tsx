
import React from "react";
import { Room } from "../types/RoomTypes";

interface ParentRoomHierarchyProps {
  rooms: Room[];
}

// Utility to build a tree structure from flat rooms array
function buildRoomHierarchy(rooms: Room[]) {
  const map: Record<string, any> = {};
  const roots: any[] = [];

  rooms.forEach(room => {
    map[room.id] = { ...room, children: [] };
  });

  rooms.forEach(room => {
    if (room.parent_room_id && map[room.parent_room_id]) {
      map[room.parent_room_id].children.push(map[room.id]);
    } else {
      roots.push(map[room.id]);
    }
  });

  return roots;
}

function renderRoomNode(room: any, level = 0) {
  return (
    <div key={room.id} style={{ marginLeft: level * 20, borderLeft: level > 0 ? '1px solid #e5e7eb' : undefined, paddingLeft: 8 }}>
      <div style={{ fontWeight: level === 0 ? 'bold' : 'normal', color: level === 0 ? '#111827' : '#374151' }}>
        {room.name} {room.room_number ? `(${room.room_number})` : ''}
        <span style={{ marginLeft: 8, fontSize: 12, color: '#6b7280' }}>{room.room_type.replace(/_/g, ' ')}</span>
      </div>
      {room.children && room.children.length > 0 && (
        <div>
          {room.children.map((child: any) => renderRoomNode(child, level + 1))}
        </div>
      )}
    </div>
  );
}

export const ParentRoomHierarchy: React.FC<ParentRoomHierarchyProps> = ({ rooms }) => {
  const hierarchy = buildRoomHierarchy(rooms);

  if (!rooms.length) return <div className="text-muted-foreground">No rooms to display.</div>;

  return (
    <div className="space-y-2">
      <h4 className="font-semibold mb-2">Room Hierarchy</h4>
      {hierarchy.map(room => renderRoomNode(room))}
    </div>
  );
};
