import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Search, UserCheck, UserX, Shield, Mail } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface UserManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  verification_status: string;
  is_approved: boolean;
  created_at: string;
  department: string;
  title: string;
  is_admin?: boolean;
}

export function UserManagementModal({ open, onOpenChange }: UserManagementModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadUsers();
    }
  }, [open]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Get profiles with admin status
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get admin roles
      const { data: adminRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (rolesError) throw rolesError;

      const adminUserIds = new Set(adminRoles?.map(role => role.user_id) || []);
      
      const usersWithAdminStatus = (profiles || []).map(profile => ({
        ...profile,
        is_admin: adminUserIds.has(profile.id)
      }));

      setUsers(usersWithAdminStatus);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          verification_status: 'verified',
          is_approved: true 
        })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "User Verified",
        description: "User has been successfully verified"
      });
      
      loadUsers();
    } catch (error) {
      console.error('Error verifying user:', error);
      toast({
        title: "Error",
        description: "Failed to verify user",
        variant: "destructive"
      });
    }
  };

  const handleRejectUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          verification_status: 'rejected',
          is_approved: false 
        })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "User Rejected",
        description: "User verification has been rejected"
      });
      
      loadUsers();
    } catch (error) {
      console.error('Error rejecting user:', error);
      toast({
        title: "Error",
        description: "Failed to reject user",
        variant: "destructive"
      });
    }
  };

  const makeAdmin = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: 'admin' });

      if (error) throw error;

      toast({
        title: "Admin Role Assigned",
        description: "User has been given admin privileges"
      });
      
      loadUsers();
    } catch (error) {
      console.error('Error making user admin:', error);
      toast({
        title: "Error",
        description: "Failed to assign admin role",
        variant: "destructive"
      });
    }
  };

  const removeAdmin = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'admin');

      if (error) throw error;

      toast({
        title: "Admin Role Removed",
        description: "User admin privileges have been revoked"
      });
      
      loadUsers();
    } catch (error) {
      console.error('Error removing admin role:', error);
      toast({
        title: "Error",
        description: "Failed to remove admin role",
        variant: "destructive"
      });
    }
  };

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string, isApproved: boolean) => {
    if (status === 'verified' && isApproved) {
      return <Badge className="bg-green-100 text-green-800">Verified</Badge>;
    }
    if (status === 'pending') {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Pending</Badge>;
    }
    if (status === 'rejected') {
      return <Badge variant="destructive">Rejected</Badge>;
    }
    return <Badge variant="secondary">Unknown</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            User Management
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[180px]">User</TableHead>
                    <TableHead className="min-w-[200px] hidden sm:table-cell">Email</TableHead>
                    <TableHead className="min-w-[120px] hidden md:table-cell">Department</TableHead>
                    <TableHead className="min-w-[100px]">Status</TableHead>
                    <TableHead className="min-w-[100px] hidden lg:table-cell">Joined</TableHead>
                    <TableHead className="min-w-[160px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {user.first_name} {user.last_name}
                            {user.is_admin && (
                              <Badge variant="outline" className="text-xs">
                                <Shield className="h-3 w-3 mr-1" />
                                Admin
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {user.title}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate max-w-[160px]">{user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{user.department || 'N/A'}</TableCell>
                      <TableCell>
                        {getStatusBadge(user.verification_status, user.is_approved)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                          {user.verification_status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleVerifyUser(user.id)}
                                className="bg-green-600 hover:bg-green-700 text-xs"
                              >
                                <UserCheck className="h-3 w-3 mr-1" />
                                Verify
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRejectUser(user.id)}
                                className="border-red-300 text-red-600 hover:bg-red-50 text-xs"
                              >
                                <UserX className="h-3 w-3 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          {user.verification_status === 'verified' && user.is_approved && !user.is_admin && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => makeAdmin(user.id)}
                              className="border-blue-300 text-blue-600 hover:bg-blue-50 text-xs"
                            >
                              <Shield className="h-3 w-3 mr-1" />
                              <span className="hidden sm:inline">Make</span> Admin
                            </Button>
                          )}
                          {user.is_admin && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeAdmin(user.id)}
                              className="border-red-300 text-red-600 hover:bg-red-50 text-xs"
                            >
                              <Shield className="h-3 w-3 mr-1" />
                              <span className="hidden sm:inline">Remove</span> Admin
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                   {filteredUsers.length === 0 && (
                     <TableRow>
                       <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                         {searchTerm ? 'No users found matching your search' : 'No users found'}
                       </TableCell>
                     </TableRow>
                   )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}