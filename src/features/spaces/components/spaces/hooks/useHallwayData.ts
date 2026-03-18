
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

interface HallwayFilters {
  selectedBuilding?: string;
  selectedFloor?: string;
}

export function useHallwayData({ selectedBuilding, selectedFloor }: HallwayFilters = {}) {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ['hallways', selectedBuilding, selectedFloor],
    queryFn: async () => {
      logger.debug("Fetching hallways with filters:", { selectedBuilding, selectedFloor });
      
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
      if (selectedBuilding && selectedBuilding !== 'all') {
        query = query.eq('floors.buildings.id', selectedBuilding);
      }

      // Apply floor filter if specified
      if (selectedFloor && selectedFloor !== 'all') {
        query = query.eq('floor_id', selectedFloor);
      }

      const { data, error } = await query;
      
      if (error) {
        logger.error('Error fetching hallways:', error);
        throw error;
      }

      // Transform data to include building information
      const transformedData = data?.map(hallway => ({
        ...hallway,
        building_name: hallway.floors?.buildings?.name || 'Unknown Building',
        floor_name: hallway.floors?.name || 'Unknown Floor'
      })) || [];

      logger.debug('Transformed hallway data:', transformedData);
      return transformedData;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    retry: 2
  });

  const deleteHallway = useMutation({
    mutationFn: async (hallwayId: string) => {
      const { error } = await supabase
        .from('hallways')
        .delete()
        .eq('id', hallwayId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hallways'] });
      toast.success('Hallway deleted successfully');
    },
    onError: (error) => {
      logger.error('Error deleting hallway:', error);
      toast.error('Failed to delete hallway');
    }
  });

  return {
    hallways: query.data,
    isLoading: query.isLoading,
    error: query.error,
    deleteHallway
  };
}
