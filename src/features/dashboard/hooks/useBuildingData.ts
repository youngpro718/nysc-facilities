// Building Data — dashboard building stats and issues
import { useQuery } from "@tanstack/react-query";
import { logger } from '@/lib/logger';
import { supabase } from "@/lib/supabase";
import { BuildingError } from "./types/errors";
import type { Building, Activity } from "@/types/dashboard";
import { QUERY_CONFIG } from '@/config';


export const useBuildingData = (userId?: string) => {
  const enabled = !!userId;
  // Fetch buildings with caching
  const { data: buildings = [], isLoading: buildingsIsLoading, refetch: refetchBuildings } = useQuery<any[]>({
    queryKey: ['buildings-v2', userId ?? null],
    queryFn: async () => {
      try {
        // First fetch buildings with floors
        const { data: buildingsData, error: buildingsError } = await supabase
          .from('buildings')
          .select(`
            id,
            name,
            address,
            status,
            created_at,
            updated_at,
            floors!floors_building_id_fkey (
              id,
              name,
              floor_number,
              status
            )
          `)
          .eq('status', 'active')
          .order('name');

        if (buildingsError) throw buildingsError;
        if (!buildingsData) throw new Error('No buildings data returned');

        // For each building, fetch rooms grouped by floor
        const buildingsWithDetails = await Promise.all(
          buildingsData.map(async (building) => {
            const floorIds = building.floors?.map(f => f.id) || [];
            
            // Fetch rooms for all floors in this building
            const { data: roomsData, error: roomsError } = await supabase
              .from('rooms')
              .select(`
                id,
                name,
                room_number,
                floor_id,
                status
              `)
              .in('floor_id', floorIds);

            if (roomsError) throw roomsError;

            // Group rooms by floor
            const roomsByFloor = roomsData?.reduce((acc, room) => {
              if (!acc[room.floor_id]) {
                acc[room.floor_id] = [];
              }
              acc[room.floor_id].push(room);
              return acc;
            }, {} as Record<string, any[]>) || {};

            return {
              ...building,
              building_floors: building.floors?.map(floor => ({
                id: floor.id,
                name: floor.name,
                floor_number: floor.floor_number
              })) || [],
              floors: building.floors?.map(floor => ({
                ...floor,
                rooms: (roomsByFloor[floor.id] || [])
              })) || []
            };
          })
        );

        return buildingsWithDetails;
      } catch (error) {
        logger.warn('Error fetching buildings:', error);
        throw new BuildingError(error instanceof Error ? error.message : 'Failed to fetch buildings');
      }
    },
    enabled,
    staleTime: QUERY_CONFIG.stale.medium, // Consider data fresh for 5 minutes
  });

  // Fetch recent activities
  const { data: activities = [], isLoading: activitiesIsLoading, refetch: refetchActivities } = useQuery<Activity[]>({
    queryKey: ['building-activities'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('building_activities')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;
        
        return (data || []).map(activity => ({
          id: activity.id,
          action: activity.description, // Map description to action
          activity_type: activity.type,
          performed_by: activity.performed_by || 'System',
          created_at: activity.created_at || new Date().toISOString(),
          metadata: {
            building_id: activity.building_id || ''
          }
        }));
      } catch (error) {
        logger.warn('Error fetching activities:', error);
        return [];
      }
    },
    enabled,
    staleTime: QUERY_CONFIG.stale.short, // Consider data fresh for 1 minute
  });

  const refreshData = async () => {
    await Promise.all([refetchBuildings(), refetchActivities()]);
  };

  return {
    buildings,
    buildingsLoading: buildingsIsLoading || !enabled,
    activities,
    activitiesLoading: activitiesIsLoading || !enabled,
    refreshData
  };
};
