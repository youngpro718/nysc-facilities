import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface AdjacentRoom {
  id: string;
  name: string;
  room_number: string | null;
  ceiling_height: string | null;
  primary_bulb_type: string | null;
  expected_fixture_count: number | null;
  actual_fixture_count: number;
  functional_count: number;
  non_functional_count: number;
  maintenance_count: number;
}

export function useAdjacentRooms(floorId: string | null) {
  return useQuery({
    queryKey: ['adjacent-rooms', floorId],
    queryFn: async () => {
      if (!floorId) return [];

      // Get all rooms on this floor
      const { data: rooms, error: roomsError } = await supabase
        .from('rooms')
        .select('id, name, room_number, ceiling_height, primary_bulb_type, expected_fixture_count')
        .eq('floor_id', floorId)
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
            ceiling_height: room.ceiling_height,
            primary_bulb_type: room.primary_bulb_type,
            expected_fixture_count: room.expected_fixture_count,
            actual_fixture_count: total,
            functional_count: functional,
            non_functional_count: nonFunctional,
            maintenance_count: maintenance,
          } as AdjacentRoom;
        })
      );

      return roomsWithLighting;
    },
    enabled: !!floorId,
    staleTime: 30_000,
  });
}
