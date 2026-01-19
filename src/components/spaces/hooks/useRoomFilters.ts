
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
    
    let filtered = rooms.filter(room => {
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
        } else {
          // For other room types, match exact room_type values
          matchesRoomType = room.room_type === roomTypeFilter || 
            roomTypeToString(room.room_type as any) === roomTypeFilter;
        }
      }

      return matchesSearch && matchesStatus && matchesBuilding && matchesFloor && matchesRoomType;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'created_desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'created_asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'room_number_asc':
          return (a.room_number || '').localeCompare(b.room_number || '');
        case 'room_number_desc':
          return (b.room_number || '').localeCompare(a.room_number || '');
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
