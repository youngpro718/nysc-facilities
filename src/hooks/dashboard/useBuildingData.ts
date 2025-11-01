import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { BuildingError } from "./types/errors";
import type { Building, Activity } from "@/types/dashboard";

export type BuildingWithLighting = Building & {
  lightingTotalFixtures: number;
  lightingWorkingFixtures: number;
  _lightingDebug?: {
    floorIdsCount: number;
    roomsCount: number;
    fixturesMapKeys: number;
    lightingTotalFixtures: number;
    lightingWorkingFixtures: number;
  };
};

export const useBuildingData = (userId?: string) => {
  const enabled = !!userId;
  // Fetch buildings with caching
  const { data: buildings = [], isLoading: buildingsIsLoading, refetch: refetchBuildings } = useQuery<BuildingWithLighting[]>({
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

        // For each building, fetch rooms and lighting fixtures
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
              .in('floor_id', floorIds)
              // Include all rooms; some rooms may not have 'active' status but still contain fixtures we need
              // to compute building lighting stats
              // .eq('status', 'active')

            if (roomsError) throw roomsError;

            // Build fixtures by room via a direct query (more reliable than nested selects)
            const roomIds = (roomsData || []).map(r => r.id);
            let fixturesByRoom: Record<string, any[]> = {};
            if (roomIds.length > 0) {
              const { data: fixturesData, error: fixturesError } = await supabase
                .from('lighting_fixtures')
                .select('id, status, bulb_count, space_id, space_type')
                .eq('space_type', 'room')
                .in('space_id', roomIds);

              if (fixturesError) throw fixturesError;

              fixturesByRoom = (fixturesData || []).reduce((acc: Record<string, any[]>, fx: any) => {
                const key = fx.space_id;
                if (!acc[key]) acc[key] = [];
                acc[key].push({
                  ...fx,
                  bulb_count: fx.bulb_count ?? 1,
                });
                return acc;
              }, {} as Record<string, any[]>);
            }

            // Group rooms by floor and attach fixtures fetched above
            const roomsByFloor = roomsData?.reduce((acc, room) => {
              if (!acc[room.floor_id]) {
                acc[room.floor_id] = [];
              }
              acc[room.floor_id].push({
                ...room,
                lighting_fixtures: (fixturesByRoom[room.id] || []).map((fixture: any) => ({
                  ...fixture,
                  bulb_count: fixture.bulb_count ?? 1,
                })),
              });
              return acc;
            }, {} as Record<string, any[]>) || {};

            // Precompute building-level lighting stats
            const allFixtures = Object.values(fixturesByRoom).flat();
            const lightingTotalFixtures = allFixtures.reduce((acc: number, fx: any) => acc + (fx.bulb_count ?? 1), 0);
            const lightingWorkingFixtures = allFixtures.reduce((acc: number, fx: any) => {
              const status = (fx.status ?? '').toString().toLowerCase();
              const isWorking = status === 'working' || status === 'functional';
              return acc + (isWorking ? (fx.bulb_count ?? 1) : 0);
            }, 0);

            // Combine everything
            return {
              ...building,
              lightingTotalFixtures,
              lightingWorkingFixtures,
              // debug fields (non-breaking)
              _lightingDebug: {
                floorIdsCount: floorIds.length,
                roomsCount: (roomsData || []).length,
                fixturesMapKeys: Object.keys(fixturesByRoom).length,
                lightingTotalFixtures,
                lightingWorkingFixtures,
              },
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
        console.error('Error fetching buildings:', error);
        throw new BuildingError(error instanceof Error ? error.message : 'Failed to fetch buildings');
      }
    },
    enabled,
    staleTime: 300000, // Consider data fresh for 5 minutes
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
        console.error('Error fetching activities:', error);
        return [];
      }
    },
    enabled,
    staleTime: 60000, // Consider data fresh for 1 minute
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
