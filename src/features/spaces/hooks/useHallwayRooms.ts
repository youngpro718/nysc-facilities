// Hallway Rooms — CRUD for hallway-room associations
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errorUtils';

export interface HallwayRoom {
  id: string;
  hallway_id: string;
  room_id: string;
  position: 'start' | 'middle' | 'end';
  side: 'left' | 'right';
  sequence_order: number;
  room: {
    id: string;
    name: string;
    room_number: string | null;
    ceiling_height: string | null;
    primary_bulb_type: string | null;
    expected_fixture_count: number | null;
  };
  actual_fixture_count?: number;
  functional_count?: number;
  non_functional_count?: number;
}

export function useHallwayRooms(hallwayId: string | null) {
  return useQuery({
    queryKey: ['hallway-rooms', hallwayId],
    queryFn: async () => {
      if (!hallwayId) return [];

      const { data, error } = await supabase
        .from('hallway_adjacent_rooms')
        .select(`
          id,
          hallway_id,
          room_id,
          position,
          side,
          sequence_order,
          room:rooms!inner (
            id,
            name,
            room_number,
            ceiling_height,
            primary_bulb_type,
            expected_fixture_count
          )
        `)
        .eq('hallway_id', hallwayId)
        .order('position', { ascending: true })
        .order('sequence_order', { ascending: true });

      if (error) throw error;

      // Fetch fixture counts for each room
      const roomsWithCounts = await Promise.all(
        (data || []).map(async (hallwayRoom: Record<string, unknown>) => {
          const { data: fixtures } = await supabase
            .from('lighting_fixtures')
            .select('status')
            .eq('space_id', hallwayRoom.room_id)
            .eq('space_type', 'room');

          const total = fixtures?.length || 0;
          const functional = fixtures?.filter(f => f.status === 'functional').length || 0;
          const nonFunctional = fixtures?.filter(f => f.status === 'non_functional').length || 0;

          return {
            ...hallwayRoom,
            actual_fixture_count: total,
            functional_count: functional,
            non_functional_count: nonFunctional,
          } as HallwayRoom;
        })
      );

      return roomsWithCounts;
    },
    enabled: !!hallwayId,
    staleTime: 30_000,
  });
}

export function useAddHallwayRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      hallway_id: string;
      room_id: string;
      position: 'start' | 'middle' | 'end';
      side: 'left' | 'right';
      sequence_order?: number;
    }) => {
      const { error } = await supabase
        .from('hallway_adjacent_rooms')
        .insert({
          hallway_id: data.hallway_id,
          room_id: data.room_id,
          position: data.position,
          side: data.side,
          sequence_order: data.sequence_order || 0,
        });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['hallway-rooms', variables.hallway_id] });
      toast.success('Room added to hallway');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useRemoveHallwayRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, hallwayId }: { id: string; hallwayId: string }) => {
      const { error } = await supabase
        .from('hallway_adjacent_rooms')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return hallwayId;
    },
    onSuccess: (hallwayId) => {
      queryClient.invalidateQueries({ queryKey: ['hallway-rooms', hallwayId] });
      toast.success('Room removed from hallway');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}
