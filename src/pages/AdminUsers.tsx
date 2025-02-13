
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  rooms?: { name: string };
}

export default function AdminUsers() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [assignedRooms, setAssignedRooms] = useState<UserAssignment[]>([]);
  const [assignedKeys, setAssignedKeys] = useState<UserAssignment[]>([]);
  const [userIssues, setUserIssues] = useState<UserIssue[]>([]);
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
        .select(`
          id,
          assigned_at,
          rooms (
            name
          )
        `)
        .eq('occupant_id', user.id);

      if (roomsError) {
        console.error('Error fetching rooms:', roomsError);
        setAssignedRooms([]);
      } else {
        setAssignedRooms(roomsData?.map((d: any) => ({
          id: d.id,
          room_name: d.rooms?.name,
          assigned_at: d.assigned_at
        })) || []);
      }

      // Fetch assigned keys
      const { data: keysData, error: keysError } = await supabase
        .from('key_assignments')
        .select(`
          id,
          assigned_at,
          keys (
            name
          )
        `)
        .eq('occupant_id', user.id)
        .is('returned_at', null);

      if (keysError) {
        console.error('Error fetching keys:', keysError);
        setAssignedKeys([]);
      } else {
        setAssignedKeys(keysData?.map((d: any) => ({
          id: d.id,
          key_name: d.keys?.name,
          assigned_at: d.assigned_at
        })) || []);
      }

      // Fetch user's reported issues
      const { data: issuesData, error: issuesError } = await supabase
        .from('issues')
        .select(`
          id,
          title,
          status,
          created_at,
          priority,
          rooms (
            name
          )
        `)
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
    navigate('/issues');
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
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            View your assignments and reported issues
          </p>
        </div>
        <Button onClick={handleReportIssue}>
          <Plus className="h-4 w-4 mr-2" />
          Report Issue
        </Button>
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
    </div>
  );
}
