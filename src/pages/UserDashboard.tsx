
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Plus, Settings } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IssueDialog } from "@/components/issues/IssueDialog";

interface RoomData {
  id: string;
  assigned_at: string;
  rooms: {
    name: string | null;
  } | null;
}

interface KeyData {
  id: string;
  assigned_at: string;
  keys: {
    name: string | null;
  } | null;
}

interface UserAssignment {
  id: string;
  room_name?: string;
  key_name?: string;
  assigned_at: string;
}

interface UserIssue {
  id: string;
  title: string;
  status: string;
  created_at: string;
  priority: string;
  rooms?: {
    name: string;
  } | null;
}

export default function UserDashboard() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [assignedRooms, setAssignedRooms] = useState<UserAssignment[]>([]);
  const [assignedKeys, setAssignedKeys] = useState<UserAssignment[]>([]);
  const [userIssues, setUserIssues] = useState<UserIssue[]>([]);
  const [showReportIssue, setShowReportIssue] = useState(false);
  const navigate = useNavigate();

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
          navigate('/profile');
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

  const handleGoToSettings = () => {
    navigate('/profile');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 px-4">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold tracking-tight">My Dashboard</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleGoToSettings}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button onClick={handleReportIssue}>
              <Plus className="h-4 w-4 mr-2" />
              Report Issue
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground">
          View your assignments and reported issues
        </p>
      </div>

      <div className="space-y-6">
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Assigned Rooms</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Room Name</TableHead>
                <TableHead>Assigned Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignedRooms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center">
                    No rooms assigned
                  </TableCell>
                </TableRow>
              ) : (
                assignedRooms.map((room) => (
                  <TableRow key={room.id}>
                    <TableCell>{room.room_name}</TableCell>
                    <TableCell>
                      {new Date(room.assigned_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Assigned Keys</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key Name</TableHead>
                <TableHead>Assigned Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignedKeys.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center">
                    No keys assigned
                  </TableCell>
                </TableRow>
              ) : (
                assignedKeys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell>{key.key_name}</TableCell>
                    <TableCell>
                      {new Date(key.assigned_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">My Reported Issues</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Date Reported</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userIssues.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No issues reported
                  </TableCell>
                </TableRow>
              ) : (
                userIssues.map((issue) => (
                  <TableRow key={issue.id}>
                    <TableCell>{issue.title}</TableCell>
                    <TableCell className="capitalize">{issue.status}</TableCell>
                    <TableCell className="capitalize">{issue.priority}</TableCell>
                    <TableCell>{issue.rooms?.name || 'N/A'}</TableCell>
                    <TableCell>
                      {new Date(issue.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      <IssueDialog 
        open={showReportIssue} 
        onOpenChange={setShowReportIssue}
        onSuccess={checkUserRoleAndFetchData}
      />
    </div>
  );
}
