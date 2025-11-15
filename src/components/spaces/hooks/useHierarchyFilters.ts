import { useMemo } from 'react';
import { Room } from '../rooms/types/RoomTypes';

export interface HierarchyFilterOptions {
  rooms: Room[] | undefined;
  showOnlyParents?: boolean;
  showOnlyChildren?: boolean;
  groupByParent?: boolean;
}

export interface GroupedRooms {
  parentRooms: Room[];
  childRooms: { [parentId: string]: Room[] };
  orphanRooms: Room[];
}

export function useHierarchyFilters({
  rooms,
  showOnlyParents = false,
  showOnlyChildren = false,
  groupByParent = false,
}: HierarchyFilterOptions) {
  
  const filteredRooms = useMemo(() => {
    if (!rooms) return [];

    let filtered = [...rooms];

    if (showOnlyParents) {
      filtered = filtered.filter(room => 
        rooms.some(otherRoom => otherRoom.parent_room_id === room.id)
      );
    }

    if (showOnlyChildren) {
      filtered = filtered.filter(room => room.parent_room_id !== null);
    }

    return filtered;
  }, [rooms, showOnlyParents, showOnlyChildren]);

  const groupedRooms = useMemo((): GroupedRooms => {
    if (!rooms || !groupByParent) {
      return {
        parentRooms: [],
        childRooms: {},
        orphanRooms: filteredRooms,
      };
    }

    const parentRooms: Room[] = [];
    const childRooms: { [parentId: string]: Room[] } = {};
    const orphanRooms: Room[] = [];

    // First pass: identify parent rooms and orphan rooms
    filteredRooms.forEach(room => {
      if (room.parent_room_id === null) {
        // Check if this room has any children
        const hasChildren = rooms.some(otherRoom => otherRoom.parent_room_id === room.id);
        if (hasChildren) {
          parentRooms.push(room);
          childRooms[room.id] = [];
        } else {
          orphanRooms.push(room);
        }
      }
    });

    // Second pass: group child rooms
    filteredRooms.forEach(room => {
      if (room.parent_room_id && childRooms[room.parent_room_id]) {
        childRooms[room.parent_room_id].push(room);
      } else if (room.parent_room_id) {
        // Child room whose parent is not in the filtered list
        orphanRooms.push(room);
      }
    });

    return {
      parentRooms,
      childRooms,
      orphanRooms,
    };
  }, [filteredRooms, rooms, groupByParent]);

  const hierarchyStats = useMemo(() => {
    if (!rooms) return { totalRooms: 0, parentRooms: 0, childRooms: 0, orphanRooms: 0 };

    const parentRoomIds = new Set(
      rooms.filter(room => room.parent_room_id === null)
        .filter(room => rooms.some(otherRoom => otherRoom.parent_room_id === room.id))
        .map(room => room.id)
    );

    const childRoomCount = rooms.filter(room => room.parent_room_id !== null).length;
    const orphanRoomCount = rooms.filter(room => 
      room.parent_room_id === null && !parentRoomIds.has(room.id)
    ).length;

    return {
      totalRooms: rooms.length,
      parentRooms: parentRoomIds.size,
      childRooms: childRoomCount,
      orphanRooms: orphanRoomCount,
    };
  }, [rooms]);

  return {
    filteredRooms,
    groupedRooms,
    hierarchyStats,
  };
}