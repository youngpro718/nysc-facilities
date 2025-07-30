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
              
              // Fetch rooms for each floor
              const { data: roomsData } = await supabase
                .from('rooms')
                .select(`
                  id,
                  name,
                  room_number,
                  status,
                  floor_id
                `)
                .in('floor_id', floorIds);

              // Fetch lighting fixtures for the rooms
              const roomIds = roomsData?.map(r => r.id) || [];
              const { data: fixturesData } = await supabase
                .from('lighting_fixtures')
                .select('*')
                .in('space_id', roomIds);

              // Map rooms to their floors with fixtures
              const floorsWithRooms = building.floors?.map(floor => ({
                ...floor,
                rooms: (roomsData || [])
                  .filter(room => room.floor_id === floor.id)
                  .map(room => ({
                    ...room,
                    lighting_fixtures: (fixturesData || [])
                      .filter(fixture => fixture.space_id === room.id)
                  }))
              }));

              return {
                ...building,
                floors: floorsWithRooms
              };
            })
          );

          console.log('Processed building data:', buildingsWithDetails);
          setBuildings(buildingsWithDetails);
        }
      }

      // Fetch only unseen, unresolved issues that have photos
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
          unified_spaces (
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
        .neq('status', 'resolved')  // Only show unresolved issues
        .not('photos', 'eq', '{}')
        .not('photos', 'is', null)
        .order('created_at', { ascending: false });

      if (issuesError) {
        console.error('Error fetching issues:', issuesError);
      } else {
        console.log('Issues data:', issuesData);
        const transformedIssues = (issuesData || []).map(issue => ({
          ...issue,
          rooms: issue.unified_spaces ? {
            id: issue.unified_spaces.id,
            name: issue.unified_spaces.name,
            room_number: issue.unified_spaces.room_number
          } : null,
          buildings: issue.buildings || null,
          floors: issue.floors || null
        }));
        setIssues(transformedIssues);
      }

      // Fetch recent activities from user_roles instead
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('user_roles')
        .select(`
          id,
          user_id,
          role,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (activitiesError) {
        console.error('Error fetching activities:', activitiesError);
      } else {
        const recentActivities = activitiesData?.slice(0, 5).map((activity: any) => ({
          id: activity.id,
          action: `Role ${activity.role}`,
          activity_type: 'user_role',
          performed_by: activity.user_id,
          created_at: activity.created_at,
          metadata: { building_id: '' }
        })) || [];
        
        setActivities(recentActivities);
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
