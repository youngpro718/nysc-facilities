
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import type { UserProfile, UserAssignment, UserIssue } from "@/types/dashboard";
import type { Building } from "@/utils/dashboardUtils";
import type { Issue, Activity } from "@/components/dashboard/BuildingsGrid";
import { toast } from "sonner";

export const useDashboardData = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [buildingsLoading, setBuildingsLoading] = useState(true);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [assignedRooms, setAssignedRooms] = useState<UserAssignment[]>([]);
  const [assignedKeys, setAssignedKeys] = useState<UserAssignment[]>([]);
  const [userIssues, setUserIssues] = useState<UserIssue[]>([]);
  const [profile, setProfile] = useState<UserProfile>({});
  const navigate = useNavigate();

  const handleMarkAsSeen = async (issueId: string) => {
    try {
      const { error } = await supabase
        .from('issues')
        .update({ seen: true })
        .eq('id', issueId);

      if (error) throw error;

      setIssues(prevIssues =>
        prevIssues.map(issue =>
          issue.id === issueId ? { ...issue, seen: true } : issue
        )
      );
    } catch (error) {
      console.error('Error marking issue as seen:', error);
      toast.error('Failed to mark issue as seen');
    }
  };

  const fetchBuildings = async () => {
    try {
      setBuildingsLoading(true);
      console.log('Fetching buildings...');
      
      const { data, error } = await supabase
        .from('buildings')
        .select(`
          id,
          name,
          address,
          status,
          floors (
            id,
            name,
            floor_number,
            rooms (
              id,
              name,
              lighting_fixtures (
                id,
                bulb_count,
                status
              )
            )
          )
        `);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Buildings data:', data);

      if (!data) {
        console.log('No buildings data received');
        setBuildings([]);
        return;
      }

      // Map the data to match our expected types
      const transformedBuildings: Building[] = data.map(building => ({
        id: building.id,
        name: building.name,
        address: building.address,
        status: building.status,
        floors: building.floors?.map(floor => ({
          id: floor.id,
          name: floor.name,
          floor_number: floor.floor_number,
          rooms: floor.rooms?.map(room => ({
            id: room.id,
            name: room.name,
            lighting_fixtures: room.lighting_fixtures?.map(fixture => ({
              id: fixture.id,
              bulb_count: fixture.bulb_count,
              status: (fixture.status === 'functional') ? 'working' : 'not_working'
            }))
          }))
        }))
      }));

      console.log('Transformed buildings:', transformedBuildings);
      setBuildings(transformedBuildings);
    } catch (error) {
      console.error('Error fetching buildings:', error);
      toast.error('Failed to fetch buildings');
      setBuildings([]);
    } finally {
      setBuildingsLoading(false);
    }
  };

  const fetchIssuesAndActivities = async () => {
    try {
      console.log('Fetching issues and activities...');
      
      // Fetch issues
      const { data: issuesData, error: issuesError } = await supabase
        .from('issues')
        .select(`
          id,
          title,
          description,
          building_id,
          photos,
          created_at,
          seen
        `)
        .order('created_at', { ascending: false });

      if (issuesError) throw issuesError;
      console.log('Issues data:', issuesData);
      setIssues(issuesData || []);

      // Fetch activities
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('building_activities')
        .select(`
          id,
          type,
          performed_by,
          created_at,
          building_id,
          description
        `)
        .order('created_at', { ascending: false });

      if (activitiesError) throw activitiesError;
      console.log('Activities data:', activitiesData);
      
      const transformedActivities = activitiesData?.map(activity => ({
        id: activity.id,
        action: activity.type,
        performed_by: activity.performed_by,
        created_at: activity.created_at,
        metadata: {
          building_id: activity.building_id,
          description: activity.description
        }
      })) || [];

      setActivities(transformedActivities);
    } catch (error) {
      console.error('Error fetching issues and activities:', error);
      toast.error('Failed to fetch issues and activities');
      setIssues([]);
      setActivities([]);
    }
  };

  const checkUserRoleAndFetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('Checking user role...');
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw sessionError;
      }

      if (!session?.user) {
        console.log('No session found, redirecting to login');
        navigate('/login');
        return;
      }

      // Check if user is admin
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (roleError) {
        console.error('Role error:', roleError);
        throw roleError;
      }

      const userIsAdmin = roleData?.role === 'admin';
      console.log('User is admin:', userIsAdmin);
      setIsAdmin(userIsAdmin);

      if (!userIsAdmin) {
        console.log('User is not admin, redirecting to dashboard');
        navigate('/dashboard');
        return;
      }

      // Fetch admin-specific data
      await Promise.all([
        fetchBuildings(),
        fetchIssuesAndActivities()
      ]);

    } catch (error) {
      console.error('Error in checkUserRoleAndFetchData:', error);
      toast.error('Failed to load dashboard data');
      navigate('/login');
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  return {
    isAdmin,
    isLoading,
    buildings,
    buildingsLoading,
    issues,
    activities,
    assignedRooms,
    assignedKeys,
    userIssues,
    profile,
    handleMarkAsSeen,
    checkUserRoleAndFetchData
  };
};
