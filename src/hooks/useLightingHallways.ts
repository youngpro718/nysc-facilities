// Lighting Hallways — hallway lighting stats hook
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface HallwayWithStats {
  id: string;
  name: string;
  floor_id: string;
  floor_name: string;
  floor_number: number;
  total_fixtures: number;
  functional_count: number;
  non_functional_count: number;
  maintenance_count: number;
}

export function useLightingHallways() {
  return useQuery({
    queryKey: ['lighting-hallways'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hallways')
        .select(`
          id,
          name,
          floor_id,
          floors(name, floor_number)
        `)
        .order('floors(floor_number)', { ascending: false });

      if (error) throw error;

      // Get fixture counts for each hallway
      const hallwaysWithStats = await Promise.all(
        (data || []).map(async (hallway: Record<string, unknown>) => {
          const { data: fixtures, error: fixturesError } = await supabase
            .from('lighting_fixtures')
            .select('status')
            .eq('space_id', hallway.id)
            .eq('space_type', 'hallway');

          if (fixturesError) throw fixturesError;

          const total = fixtures?.length || 0;
          const functional = fixtures?.filter(f => f.status === 'functional').length || 0;
          const nonFunctional = fixtures?.filter(f => f.status === 'non_functional').length || 0;
          const maintenance = fixtures?.filter(f => f.status === 'maintenance_needed').length || 0;

          return {
            id: hallway.id,
            name: hallway.name,
            floor_id: hallway.floor_id,
            floor_name: (hallway as any).floors?.name || 'Unknown Floor',
            floor_number: (hallway as any).floors?.floor_number || 0,
            total_fixtures: total,
            functional_count: functional,
            non_functional_count: nonFunctional,
            maintenance_count: maintenance,
          } as HallwayWithStats;
        })
      );

      return hallwaysWithStats.filter(h => h.total_fixtures > 0);
    },
    staleTime: 30_000,
  });
}

export function useHallwayFixtures(hallwayId: string | null) {
  return useQuery({
    queryKey: ['hallway-fixtures', hallwayId],
    queryFn: async () => {
      if (!hallwayId) return [];

      const { data, error } = await supabase
        .from('lighting_fixtures')
        .select('*')
        .eq('space_id', hallwayId)
        .eq('space_type', 'hallway')
        .order('sequence_number', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!hallwayId,
    staleTime: 30_000,
  });
}
