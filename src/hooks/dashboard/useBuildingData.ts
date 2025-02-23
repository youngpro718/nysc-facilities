
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BuildingError } from "./types/errors";
import type { Building, Activity } from "@/types/dashboard";

export const useBuildingData = (userId?: string) => {
  // Fetch buildings with caching
  const { data: buildings = [], isLoading: buildingsLoading } = useQuery<Building[]>({
    queryKey: ['buildings'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('buildings')
          .select('*');

        if (error) throw new BuildingError(`Failed to fetch buildings: ${error.message}`);
        if (!data) throw new BuildingError('No buildings data returned');
        return data;
      } catch (error) {
        console.error('Error fetching buildings:', error);
        throw new BuildingError(error instanceof Error ? error.message : 'Failed to fetch buildings');
      }
    },
    enabled: !!userId,
    staleTime: 300000,
  });

  // Fetch activities
  const { data: activities = [] } = useQuery<Activity[]>({
    queryKey: ['activities'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('building_activities')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw new BuildingError(`Failed to fetch activities: ${error.message}`);
        if (!data) throw new BuildingError('No activities data returned');
        
        return data.map(activity => ({
          id: activity.id,
          action: activity.description,
          activity_type: activity.type,
          performed_by: activity.performed_by,
          created_at: activity.created_at,
          metadata: {
            building_id: activity.building_id
          }
        }));
      } catch (error) {
        console.error('Error fetching activities:', error);
        throw new BuildingError(error instanceof Error ? error.message : 'Failed to fetch activities');
      }
    },
    enabled: !!userId,
    staleTime: 60000,
  });

  return { buildings, buildingsLoading, activities };
};
