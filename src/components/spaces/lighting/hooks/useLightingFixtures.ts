
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DatabaseLightingFixture, mapDatabaseFixtureToLightingFixture } from "../types/databaseTypes";

interface UseLightingFixturesProps {
  selectedBuilding: string;
  selectedFloor: string;
}

export function useLightingFixtures({ selectedBuilding, selectedFloor }: UseLightingFixturesProps) {
  return useQuery<DatabaseLightingFixture[], Error>({
    queryKey: ['lighting-fixtures', selectedBuilding, selectedFloor],
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

      return (data || []).map(fixture => mapDatabaseFixtureToLightingFixture(fixture));
    }
  });
}
