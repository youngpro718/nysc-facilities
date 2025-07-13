import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Search, Shield, Users, UserCheck, Clock } from "lucide-react";
import { PendingUsersSection } from "./user-management/PendingUsersSection";
import { VerifiedUsersSection } from "./user-management/VerifiedUsersSection";
import { AdminUsersSection } from "./user-management/AdminUsersSection";
import { AdminConfirmationDialog } from "./user-management/AdminConfirmationDialog";

interface UserManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface User {
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

export function EnhancedUserManagementModal({ open, onOpenChange }: UserManagementModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [confirmationType, setConfirmationType] = useState<'promote' | 'demote'>('promote');
  const [pendingActionUser, setPendingActionUser] = useState<User | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadUsers();
      getCurrentUser();
    }
  }, [open]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

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

  const initiateAdminChange = (user: User, action: 'promote' | 'demote') => {
    // Prevent self-admin removal
    if (action === 'demote' && user.id === currentUserId) {
      toast({
        title: "Cannot Remove Own Admin Status",
        description: "You cannot remove your own admin privileges for security reasons",
        variant: "destructive"
      });
      return;
    }

    setPendingActionUser(user);
    setConfirmationType(action);
    setConfirmationOpen(true);
  };

  const executeAdminChange = async () => {
    if (!pendingActionUser) return;

    try {
      if (confirmationType === 'promote') {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: pendingActionUser.id, role: 'admin' });

        if (error) throw error;

        toast({
          title: "Admin Role Assigned",
          description: `${pendingActionUser.first_name} ${pendingActionUser.last_name} has been promoted to admin`
        });
      } else {
        // Check if this is the last admin
        const adminCount = users.filter(u => u.is_admin).length;
        if (adminCount <= 1) {
          toast({
            title: "Cannot Remove Last Admin",
            description: "At least one admin must remain in the system",
            variant: "destructive"
          });
          setConfirmationOpen(false);
          setPendingActionUser(null);
          return;
        }

        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', pendingActionUser.id)
          .eq('role', 'admin');

        if (error) throw error;

        toast({
          title: "Admin Role Removed",
          description: `${pendingActionUser.first_name} ${pendingActionUser.last_name} admin privileges have been revoked`
        });
      }
      
      loadUsers();
      setConfirmationOpen(false);
      setPendingActionUser(null);
    } catch (error) {
      console.error('Error changing admin status:', error);
      toast({
        title: "Error",
        description: "Failed to change admin status",
        variant: "destructive"
      });
    }
  };

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingUsers = filteredUsers.filter(user => user.verification_status === 'pending');
  const verifiedUsers = filteredUsers.filter(user => 
    user.verification_status === 'verified' && user.is_approved && !user.is_admin
  );
  const adminUsers = filteredUsers.filter(user => user.is_admin);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              User Management Dashboard
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

            <Tabs defaultValue="pending" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="pending" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Pending ({pendingUsers.length})
                </TabsTrigger>
                <TabsTrigger value="verified" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Verified ({verifiedUsers.length})
                </TabsTrigger>
                <TabsTrigger value="admins" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Admins ({adminUsers.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="mt-4">
                <PendingUsersSection
                  users={pendingUsers}
                  loading={loading}
                  onVerify={handleVerifyUser}
                  onReject={handleRejectUser}
                />
              </TabsContent>

              <TabsContent value="verified" className="mt-4">
                <VerifiedUsersSection
                  users={verifiedUsers}
                  loading={loading}
                  onPromoteToAdmin={(user) => initiateAdminChange(user, 'promote')}
                />
              </TabsContent>

              <TabsContent value="admins" className="mt-4">
                <AdminUsersSection
                  users={adminUsers}
                  loading={loading}
                  currentUserId={currentUserId}
                  onDemoteFromAdmin={(user) => initiateAdminChange(user, 'demote')}
                />
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      <AdminConfirmationDialog
        open={confirmationOpen}
        onOpenChange={setConfirmationOpen}
        user={pendingActionUser}
        action={confirmationType}
        onConfirm={executeAdminChange}
      />
    </>
  );
}