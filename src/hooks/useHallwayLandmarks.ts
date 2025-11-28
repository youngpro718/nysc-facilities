import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface HallwayLandmark {
  id: string;
  hallway_id: string;
  name: string;
  type: 'elevator_bank' | 'stairwell' | 'entrance' | 'intersection' | 'room' | 'other';
  sequence_order: number;
  fixture_range_start: number | null;
  fixture_range_end: number | null;
}

export function useHallwayLandmarks(hallwayId: string | null) {
  return useQuery({
    queryKey: ['hallway-landmarks', hallwayId],
    queryFn: async () => {
      if (!hallwayId) return [];

      const { data, error } = await supabase
        .from('hallway_landmarks')
        .select('*')
        .eq('hallway_id', hallwayId)
        .order('sequence_order', { ascending: true });

      if (error) throw error;
      return data as HallwayLandmark[];
    },
    enabled: !!hallwayId,
    staleTime: 60_000,
  });
}

export function useHallwayDetails(hallwayId: string | null) {
  return useQuery({
    queryKey: ['hallway-details', hallwayId],
    queryFn: async () => {
      if (!hallwayId) return null;

      const { data, error } = await supabase
        .from('hallways')
        .select('id, name, code, start_reference, end_reference, estimated_walk_time_seconds, floor_id')
        .eq('id', hallwayId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!hallwayId,
    staleTime: 60_000,
  });
}
