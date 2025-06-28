
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface HallwayFilters {
  buildingId?: string;
  floorId?: string;
}

export function useHallwayData({ buildingId, floorId }: HallwayFilters = {}) {
  return useQuery({
    queryKey: ['hallways', buildingId, floorId],
    queryFn: async () => {
      console.log("Fetching hallways with filters:", { buildingId, floorId });
      
      let query = supabase
        .from('hallways')
        .select(`
          *,
          floors!hallways_floor_id_fkey!inner (
            id,
            name,
            buildings!floors_building_id_fkey!inner (
              id,
              name
            )
          )
        `);

      // Apply building filter if specified
      if (buildingId && buildingId !== 'all') {
        query = query.eq('floors.buildings.id', buildingId);
      }

      // Apply floor filter if specified
      if (floorId && floorId !== 'all') {
        query = query.eq('floor_id', floorId);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching hallways:', error);
        throw error;
      }

      // Transform data to include building information
      const transformedData = data?.map(hallway => ({
        ...hallway,
        building_name: hallway.floors?.buildings?.name || 'Unknown Building',
        floor_name: hallway.floors?.name || 'Unknown Floor'
      })) || [];

      console.log('Transformed hallway data:', transformedData);
      return transformedData;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    retry: 2
  });
}
