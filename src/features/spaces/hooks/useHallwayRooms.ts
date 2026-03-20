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

      // Return rooms with default counts (lighting module removed)
      const roomsWithCounts = (data || []).map((hallwayRoom: Record<string, unknown>) => ({
        ...hallwayRoom,
        actual_fixture_count: 0,
        functional_count: 0,
        non_functional_count: 0,
      } as HallwayRoom));

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
