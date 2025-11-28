import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface RoomWithLighting {
  id: string;
  name: string;
  room_number: string | null;
  floor_id: string;
  floor_name: string;
  floor_number: number;
  building_name: string;
  total_fixtures: number;
  functional_count: number;
  non_functional_count: number;
  maintenance_count: number;
}

export function useLightingRooms() {
  return useQuery({
    queryKey: ['lighting-rooms'],
    queryFn: async () => {
      // Get all rooms with their building/floor info
      const { data: rooms, error: roomsError } = await supabase
        .from('rooms')
        .select(`
          id,
          name,
          room_number,
          floor_id,
          floors(
            name,
            floor_number,
            buildings(name)
          )
        `)
        .order('room_number', { ascending: true });

      if (roomsError) throw roomsError;

      // Get fixture counts for each room
      const roomsWithLighting = await Promise.all(
        (rooms || []).map(async (room: any) => {
          const { data: fixtures, error: fixturesError } = await supabase
            .from('lighting_fixtures')
            .select('status')
            .eq('space_id', room.id)
            .eq('space_type', 'room');

          if (fixturesError) throw fixturesError;

          const total = fixtures?.length || 0;
          const functional = fixtures?.filter(f => f.status === 'functional').length || 0;
          const nonFunctional = fixtures?.filter(f => f.status === 'non_functional').length || 0;
          const maintenance = fixtures?.filter(f => f.status === 'maintenance_needed').length || 0;

          return {
            id: room.id,
            name: room.name,
            room_number: room.room_number,
            floor_id: room.floor_id,
            floor_name: room.floors?.name || 'Unknown Floor',
            floor_number: room.floors?.floor_number || 0,
            building_name: room.floors?.buildings?.name || 'Unknown Building',
            total_fixtures: total,
            functional_count: functional,
            non_functional_count: nonFunctional,
            maintenance_count: maintenance,
          } as RoomWithLighting;
        })
      );

      // Only return rooms that have fixtures
      return roomsWithLighting.filter(r => r.total_fixtures > 0);
    },
    staleTime: 30_000,
  });
}

export function useRoomFixtures(roomId: string | null) {
  return useQuery({
    queryKey: ['room-fixtures', roomId],
    queryFn: async () => {
      if (!roomId) return [];

      const { data, error } = await supabase
        .from('lighting_fixtures')
        .select('*')
        .eq('space_id', roomId)
        .eq('space_type', 'room')
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!roomId,
    staleTime: 30_000,
  });
}
