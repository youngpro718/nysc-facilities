import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import type { UserProfile, UserAssignment, UserIssue } from "@/types/dashboard";
import type { Building } from "@/utils/dashboardUtils";
import type { Issue, Activity } from "@/components/dashboard/BuildingsGrid";

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
    }
  };

  const fetchBuildings = async (userId: string) => {
    try {
      setBuildingsLoading(true);
      const { data, error } = await supabase
        .from('buildings')
        .select(`
          id,
          name,
          address,
          status,
          floors:building_floors (
            id,
            name,
            floor_number,
            rooms:building_rooms (
              id,
              room_number,
              room_lighting_status:room_lighting_fixtures (
                working_fixtures,
                total_fixtures
              )
            )
          )
        `);

      if (error) throw error;
      setBuildings(data || []);
    } catch (error) {
      console.error('Error fetching buildings:', error);
    } finally {
      setBuildingsLoading(false);
    }
  };

  const fetchIssuesAndActivities = async (userId: string) => {
    try {
      // Fetch issues
      const { data: issuesData, error: issuesError } = await supabase
        .from('issues')
        .select('id, title, description, building_id, photos, created_at, seen')
        .order('created_at', { ascending: false });

      if (issuesError) throw issuesError;
      setIssues(issuesData || []);

      // Fetch activities
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('building_activities')
        .select('id, description as action, performed_by, created_at, type, building_id')
        .order('created_at', { ascending: false });

      if (activitiesError) throw activitiesError;
      setActivities(
        (activitiesData || []).map(activity => ({
          ...activity,
          metadata: {
            building_id: activity.building_id,
            type: activity.type
          }
        }))
      );
    } catch (error) {
      console.error('Error fetching issues and activities:', error);
    }
  };

  const checkUserRoleAndFetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate('/auth');
        return;
      }

      // Fetch user profile and check role
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('username, first_name, last_name, title, avatar_url')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      } else {
        setProfile(profileData || {});
      }

      // Check if user is admin
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (roleError) {
        console.error('Error fetching user role:', roleError);
        setIsAdmin(false);
      } else {
        const userIsAdmin = roleData?.role === 'admin';
        setIsAdmin(userIsAdmin);

        if (userIsAdmin) {
          // Fetch admin-specific data
          await Promise.all([
            fetchBuildings(session.user.id),
            fetchIssuesAndActivities(session.user.id)
          ]);
        } else {
          navigate('/dashboard');
          return;
        }
      }

      // Fetch assigned rooms
      const { data: roomsData, error: roomsError } = await supabase
        .from('occupant_room_assignments')
        .select('id, assigned_at, rooms:rooms(name)')
        .eq('occupant_id', session.user.id);

      if (roomsError) {
        console.error('Error fetching rooms:', roomsError);
        setAssignedRooms([]);
      } else {
        const processedRooms: UserAssignment[] = roomsData.map(room => ({
          id: room.id,
          room_name: room.rooms?.name || undefined,
          assigned_at: room.assigned_at
        }));
        setAssignedRooms(processedRooms);
      }

      // Fetch assigned keys
      const { data: keysData, error: keysError } = await supabase
        .from('key_assignments')
        .select('id, assigned_at, keys:keys(name)')
        .eq('occupant_id', session.user.id)
        .is('returned_at', null);

      if (keysError) {
        console.error('Error fetching keys:', keysError);
        setAssignedKeys([]);
      } else {
        const processedKeys: UserAssignment[] = keysData.map(key => ({
          id: key.id,
          key_name: key.keys?.name || undefined,
          assigned_at: key.assigned_at
        }));
        setAssignedKeys(processedKeys);
      }

      // Fetch user's reported issues
      const { data: issuesData, error: issuesError } = await supabase
        .from('issues')
        .select('id, title, status, created_at, priority, rooms:rooms(name)')
        .eq('created_by', session.user.id)
        .order('created_at', { ascending: false });

      if (issuesError) {
        console.error('Error fetching issues:', issuesError);
        setUserIssues([]);
      } else {
        setUserIssues(issuesData || []);
      }

    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
