
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
      
      // Fetch buildings
      const { data: buildingsData, error: buildingsError } = await supabase
        .from('buildings')
        .select('*');

      if (buildingsError) {
        console.error('Error fetching buildings:', buildingsError);
      } else {
        // Ensure status is correctly typed
        const typedBuildings: Building[] = (buildingsData || []).map(building => ({
          ...building,
          status: building.status === 'under_maintenance' ? 'under_maintenance' : 
                 building.status === 'inactive' ? 'inactive' : 'active'
        }));
        setBuildings(typedBuildings);
      }

      // Fetch issues
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
          rooms (name)
        `)
        .order('created_at', { ascending: false });

      if (issuesError) {
        console.error('Error fetching issues:', issuesError);
      } else {
        setIssues(issuesData || []);
      }

      // Fetch activities
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('user_activity_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (activitiesError) {
        console.error('Error fetching activities:', activitiesError);
      } else {
        // Ensure activity data matches our type
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
