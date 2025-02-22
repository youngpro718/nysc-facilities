
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Building, UserIssue, Activity } from "@/types/dashboard";

export const useAdminDashboardData = () => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [buildingsLoading, setBuildingsLoading] = useState(true);
  const [issues, setIssues] = useState<UserIssue[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  const fetchAdminData = async () => {
    try {
      setBuildingsLoading(true);
      
      // Fetch buildings with correct relationships
      const { data: buildingsData, error: buildingsError } = await supabase
        .from('buildings')
        .select(`
          id,
          name,
          address,
          status,
          created_at,
          updated_at,
          floors (
            id,
            name,
            floor_number
          )
        `)
        .eq('status', 'active')
        .order('name');

      if (buildingsError) {
        console.error('Error fetching buildings:', buildingsError);
      } else {
        // If we have buildings, fetch spaces and fixtures for each building
        if (buildingsData) {
          const buildingsWithDetails = await Promise.all(
            buildingsData.map(async (building) => {
              const floorIds = building.floors?.map(f => f.id) || [];
              
              // Fetch spaces for each floor
              const { data: spacesData } = await supabase
                .from('new_spaces')
                .select(`
                  id,
                  name,
                  type,
                  room_number,
                  status,
                  floor_id
                `)
                .in('floor_id', floorIds);

              // Fetch lighting fixtures for the spaces
              const spaceIds = spacesData?.map(s => s.id) || [];
              const { data: fixturesData } = await supabase
                .from('lighting_fixtures')
                .select('*')
                .in('space_id', spaceIds);

              // Map spaces to their floors with fixtures
              const floorsWithSpaces = building.floors?.map(floor => ({
                ...floor,
                new_spaces: (spacesData || [])
                  .filter(space => space.floor_id === floor.id)
                  .map(space => ({
                    ...space,
                    lighting_fixtures: (fixturesData || [])
                      .filter(fixture => fixture.space_id === space.id)
                  }))
              }));

              return {
                ...building,
                floors: floorsWithSpaces
              };
            })
          );

          console.log('Processed building data:', buildingsWithDetails);
          setBuildings(buildingsWithDetails);
        }
      }

      // Fetch only unseen issues that have photos
      const { data: issuesData, error: issuesError } = await supabase
        .from('issues')
        .select(`
          id,
          title,
          description,
          status,
          created_at,
          priority,
          building_id,
          seen,
          photos,
          space_id,
          new_spaces (
            id,
            name,
            room_number
          ),
          buildings (
            name
          ),
          floors (
            name
          )
        `)
        .eq('seen', false)
        .not('photos', 'eq', '{}')
        .not('photos', 'is', null)
        .order('created_at', { ascending: false });

      if (issuesError) {
        console.error('Error fetching issues:', issuesError);
      } else {
        console.log('Issues data:', issuesData);
        const transformedIssues = (issuesData || []).map(issue => ({
          ...issue,
          rooms: issue.new_spaces ? {
            id: issue.new_spaces.id,
            name: issue.new_spaces.name,
            room_number: issue.new_spaces.room_number
          } : null,
          buildings: issue.buildings || null,
          floors: issue.floors || null
        }));
        setIssues(transformedIssues);
      }

      // Fetch recent activities
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('user_activity_history')
        .select(`
          id,
          action,
          activity_type,
          performed_by,
          created_at,
          metadata
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (activitiesError) {
        console.error('Error fetching activities:', activitiesError);
      } else {
        const typedActivities: Activity[] = (activitiesData || []).map(activity => {
          let metadata = { building_id: '' };
          if (activity.metadata && typeof activity.metadata === 'object' && !Array.isArray(activity.metadata)) {
            const metadataObj = activity.metadata as Record<string, unknown>;
            metadata = {
              building_id: (metadataObj.building_id as string) || '',
              ...metadataObj
            };
          }
          return {
            id: activity.id,
            action: activity.action,
            activity_type: activity.activity_type,
            performed_by: activity.performed_by,
            created_at: activity.created_at,
            metadata
          };
        });
        setActivities(typedActivities);
      }

    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setBuildingsLoading(false);
    }
  };

  const handleMarkAsSeen = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('issues')
        .update({ seen: true })
        .eq('id', id);

      if (error) {
        console.error('Error marking issue as seen:', error);
      } else {
        setIssues(prev => prev.filter(issue => issue.id !== id));
      }
    } catch (error) {
      console.error('Error marking issue as seen:', error);
    }
  }, []);

  return {
    buildings,
    buildingsLoading,
    issues,
    activities,
    handleMarkAsSeen,
    fetchAdminData
  };
};
