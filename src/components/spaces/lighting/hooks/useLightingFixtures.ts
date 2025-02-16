
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
      // If 'all' is selected, we don't include that filter
      const query = supabase
        .from('lighting_fixture_details')
        .select('*')
        .order('name');

      // Only add floor filter if a specific floor is selected
      if (selectedFloor !== 'all') {
        query.eq('floor_id', selectedFloor);
      }

      // Only add building filter if a specific building is selected
      if (selectedBuilding !== 'all') {
        query.eq('building_id', selectedBuilding);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching lighting fixtures:', error);
        throw error;
      }

      return data || [];
    }
  });
}
