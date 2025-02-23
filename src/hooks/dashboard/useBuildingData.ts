
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Building, Activity } from "@/types/dashboard";

export const useBuildingData = (userId?: string) => {
  // Fetch buildings with caching
  const { data: buildings = [], isLoading: buildingsLoading } = useQuery<Building[]>({
    queryKey: ['buildings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('buildings')
        .select('*');
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    staleTime: 300000,
  });

  // Fetch activities
  const { data: activities = [] } = useQuery<Activity[]>({
    queryKey: ['activities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('building_activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      
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
    },
    enabled: !!userId,
    staleTime: 60000,
  });

  return { buildings, buildingsLoading, activities };
};
