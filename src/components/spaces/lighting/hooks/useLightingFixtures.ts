
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DatabaseLightingFixture, mapDatabaseFixtureToLightingFixture } from "../types/databaseTypes";

interface UseLightingFixturesProps {
  selectedBuilding: string;
  selectedFloor: string;
}

export function useLightingFixtures({ selectedBuilding, selectedFloor }: UseLightingFixturesProps) {
  const queryKey = ['lighting-fixtures', selectedBuilding, selectedFloor];
  
  return useQuery<DatabaseLightingFixture[]>({
    queryKey,
    queryFn: async () => {
      console.log("Fetching lighting fixtures...");
      
      const { data, error } = await supabase
        .from('lighting_fixture_details')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching fixtures:', error);
        throw error;
      }
      
      console.log("Raw fixtures data:", data);
      
      return (data || []).map(fixture => mapDatabaseFixtureToLightingFixture(fixture));
    }
  });
}
