import { useMemo } from 'react';
import type { Room } from '../rooms/types/RoomTypes';
import { roomTypeToString } from '../rooms/types/roomEnums';

interface UseRoomFiltersProps {
  rooms: Room[] | undefined;
  searchQuery: string;
  sortBy: string;
  statusFilter: string;
  selectedBuilding: string;
  selectedFloor: string;
  roomTypeFilter?: string;
}

interface RoomFiltersResult {
  filteredAndSortedRooms: Room[];
  buildings: string[];
  floors: string[];
}

export function useRoomFilters({
  rooms,
  searchQuery,
  sortBy,
  statusFilter,
  selectedBuilding,
  selectedFloor,
  roomTypeFilter = "",
}: UseRoomFiltersProps): RoomFiltersResult {
  const filteredAndSortedRooms = useMemo(() => {
    if (!rooms) return [];
    
    const filtered = rooms.filter(room => {
      const searchFields = [
        room.name?.toLowerCase() || '',
        room.room_number?.toLowerCase() || '',
        room.floor?.building?.name?.toLowerCase() || '',
        room.floor?.name?.toLowerCase() || '',
        room.room_type?.toLowerCase() || '',
        room.description?.toLowerCase() || ''
      ].join(' ');

      const matchesSearch = searchQuery ? searchFields.includes(searchQuery.toLowerCase()) : true;
      const matchesStatus = statusFilter === 'all' || room.status === statusFilter;
      const matchesBuilding = selectedBuilding === 'all' || 
        room.floor?.building?.id === selectedBuilding;
      const matchesFloor = selectedFloor === 'all' || 
        room.floor_id === selectedFloor;
      
      // Enhanced room type filtering including storage rooms
      let matchesRoomType = true;
      if (roomTypeFilter && roomTypeFilter !== "") {
        if (roomTypeFilter === "chamber") {
          // For chamber rooms, match exact room_type
          matchesRoomType = room.room_type === "chamber";
        } else if (roomTypeFilter === "storage") {
          // For storage filter, check is_storage flag
          matchesRoomType = room.is_storage === true;
        } else if (roomTypeFilter === "water_cooler") {
          // Not a room type: shows every room flagged as having a cooler
          matchesRoomType = room.has_water_cooler === true;
        } else {
          // For other room types, match exact room_type values
          matchesRoomType = room.room_type === roomTypeFilter || 
            roomTypeToString(room.room_type as any) === roomTypeFilter;
        }
      }

      return matchesSearch && matchesStatus && matchesBuilding && matchesFloor && matchesRoomType;
    });

    // Missing timestamps sort last regardless of direction
    const time = (value: string | null | undefined) => {
      const t = value ? new Date(value).getTime() : NaN;
      return Number.isNaN(t) ? -Infinity : t;
    };

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name_asc':
          return a.name.localeCompare(b.name, undefined, { numeric: true });
        case 'name_desc':
          return b.name.localeCompare(a.name, undefined, { numeric: true });
        case 'created_at_desc':
          return time(b.created_at) - time(a.created_at);
        case 'updated_at_desc':
          return time(b.updated_at) - time(a.updated_at);
        case 'room_number_asc':
        case 'room_number_desc': {
          // Rooms without a number always sort last, in either direction
          if (!a.room_number || !b.room_number) {
            return (a.room_number ? 0 : 1) - (b.room_number ? 0 : 1);
          }
          const cmp = a.room_number.localeCompare(b.room_number, undefined, { numeric: true });
          return sortBy === 'room_number_asc' ? cmp : -cmp;
        }
        default:
          return 0;
      }
    });
  }, [rooms, searchQuery, sortBy, statusFilter, selectedBuilding, selectedFloor, roomTypeFilter]);

  const buildings = useMemo(() => {
    if (!rooms) return [];
    const uniqueBuildings = new Set(rooms.map(room => room.floor?.building?.name).filter(Boolean));
    return Array.from(uniqueBuildings);
  }, [rooms]);

  const floors = useMemo(() => {
    if (!rooms) return [];
    const uniqueFloors = new Set(rooms.map(room => room.floor?.name).filter(Boolean));
    return Array.from(uniqueFloors);
  }, [rooms]);

  return {
    filteredAndSortedRooms,
    buildings,
    floors,
  };
}
