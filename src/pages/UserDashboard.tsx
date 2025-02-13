
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { IssueDialog } from "@/components/issues/IssueDialog";
import { ReportedIssuesCard } from "@/components/dashboard/ReportedIssuesCard";
import { AssignedRoomsCard } from "@/components/dashboard/AssignedRoomsCard";
import { AssignedKeysCard } from "@/components/dashboard/AssignedKeysCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useIsMobile } from "@/hooks/useIsMobile";
import type { RoomData, KeyData, UserAssignment, UserIssue } from "@/types/dashboard";

interface UserProfile {
  username?: string;
  first_name?: string;
  last_name?: string;
  title?: string;
  avatar_url?: string;
}

export default function UserDashboard() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [assignedRooms, setAssignedRooms] = useState<UserAssignment[]>([]);
  const [assignedKeys, setAssignedKeys] = useState<UserAssignment[]>([]);
  const [userIssues, setUserIssues] = useState<UserIssue[]>([]);
  const [showReportIssue, setShowReportIssue] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({});
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    checkUserRoleAndFetchData();
  }, []);

  const checkUserRoleAndFetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('username, first_name, last_name, title, avatar_url')
        .eq('id', user.id)
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
        .eq('user_id', user.id)
        .maybeSingle();

      if (roleError) {
        console.error('Error fetching user role:', roleError);
        setIsAdmin(false);
      } else {
        const userIsAdmin = roleData?.role === 'admin';
        setIsAdmin(userIsAdmin);

        if (userIsAdmin) {
          navigate('/');
          return;
        }
      }

      // Fetch assigned rooms
      const { data: roomsData, error: roomsError } = await supabase
        .from('occupant_room_assignments')
        .select('id, assigned_at, rooms:rooms(name)')
        .eq('occupant_id', user.id);

      if (roomsError) {
        console.error('Error fetching rooms:', roomsError);
        setAssignedRooms([]);
      } else {
        const typedRoomsData = roomsData as RoomData[];
        const processedRooms: UserAssignment[] = typedRoomsData.map(room => ({
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
        .eq('occupant_id', user.id)
        .is('returned_at', null);

      if (keysError) {
        console.error('Error fetching keys:', keysError);
        setAssignedKeys([]);
      } else {
        const typedKeysData = keysData as KeyData[];
        const processedKeys: UserAssignment[] = typedKeysData.map(key => ({
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
        .eq('created_by', user.id)
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

  const handleReportIssue = () => {
    setShowReportIssue(true);
  };

  const getInitials = () => {
    const first = profile.first_name?.[0] || '';
    const last = profile.last_name?.[0] || '';
    return (first + last).toUpperCase() || 'U';
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar className={isMobile ? "h-12 w-12" : "h-16 w-16"}>
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback>{getInitials()}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold tracking-tight`}>
                {profile.first_name ? `${profile.first_name} ${profile.last_name}` : 'My Dashboard'}
              </h1>
              {profile.title && (
                <p className="text-muted-foreground text-sm sm:text-lg">
                  {profile.title}
                </p>
              )}
            </div>
          </div>
          <Button 
            onClick={handleReportIssue}
            size={isMobile ? "sm" : "default"}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Report Issue
          </Button>
        </div>
        <p className="text-muted-foreground text-sm border-t mt-4 pt-4">
          View your assignments and reported issues
        </p>
      </div>

      <div className="space-y-4 sm:space-y-6">
        <ReportedIssuesCard issues={userIssues} />
        <AssignedRoomsCard rooms={assignedRooms} />
        <AssignedKeysCard keys={assignedKeys} />
      </div>

      <IssueDialog 
        open={showReportIssue} 
        onOpenChange={setShowReportIssue}
        onSuccess={checkUserRoleAndFetchData}
      />
    </div>
  );
}
