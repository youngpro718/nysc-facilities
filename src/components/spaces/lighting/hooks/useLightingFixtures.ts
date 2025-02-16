
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface UseLightingFixturesProps {
  selectedBuilding: string;
  selectedFloor: string;
}

export function useLightingFixtures({ selectedBuilding, selectedFloor }: UseLightingFixturesProps) {
  return useQuery({
    queryKey: ['lighting-fixtures', selectedBuilding, selectedFloor] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lighting_fixture_details')
        .select('*')
        .eq(selectedFloor !== 'all' ? 'floor_id' : 'floor_id', selectedFloor)
        .eq(selectedBuilding !== 'all' ? 'building_id' : 'building_id', selectedBuilding)
        .order('name');

      if (error) throw error;
      return data || [];
    }
  });
}
