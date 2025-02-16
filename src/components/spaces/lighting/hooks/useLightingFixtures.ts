
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
      const query = supabase
        .from('lighting_fixture_details')
        .select('*');

      if (selectedFloor !== 'all') {
        query.eq('floor_id', selectedFloor);
      }

      if (selectedBuilding !== 'all') {
        query.eq('building_id', selectedBuilding);
      }

      const { data, error } = await query.order('name');

      if (error) {
        console.error('Error fetching lighting fixtures:', error);
        throw error;
      }

      console.log('Lighting fixtures data:', data); // Debug log

      return data || [];
    }
  });
}
