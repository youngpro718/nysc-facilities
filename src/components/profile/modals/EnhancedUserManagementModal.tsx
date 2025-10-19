import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Search, Shield, Users, UserCheck, Clock, RefreshCw } from "lucide-react";
import { PendingUsersSection } from "./user-management/PendingUsersSection";
import { VerifiedUsersSection } from "./user-management/VerifiedUsersSection";
import { AdminUsersSection } from "./user-management/AdminUsersSection";
import { AllUsersSection } from "./user-management/AllUsersSection";
import { AdminConfirmationDialog } from "./user-management/AdminConfirmationDialog";
import { useEnhancedAdminControls } from "@/hooks/admin/useEnhancedAdminControls";
import { EditUserDialog } from "./user-management/EditUserDialog";
import { SuspendUserDialog } from "./user-management/SuspendUserDialog";
import { VerificationOverrideDialog } from "./user-management/VerificationOverrideDialog";

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
  metadata?: any;
  access_level?: 'none' | 'read' | 'write' | 'admin';
  is_suspended?: boolean;
  suspension_reason?: string;
  suspended_at?: string;
}

export function EnhancedUserManagementModal({ open, onOpenChange }: UserManagementModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [confirmationType, setConfirmationType] = useState<'promote' | 'demote'>('promote');
  const [pendingActionUser, setPendingActionUser] = useState<User | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { toast } = useToast();
  const adminControls = useEnhancedAdminControls();

  useEffect(() => {
    if (open) {
      loadUsers();
      getCurrentUser();
      // Subscribe to realtime changes for profiles and user_roles to reflect new profiles/admin changes
      const channel = supabase
        .channel('admin-user-management')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'profiles' },
          () => loadUsers()
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'user_roles' },
          () => loadUsers()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [open]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const loadUsers = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
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
      setRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    loadUsers(true);
    toast({
      title: "Refreshing",
      description: "Loading latest user data..."
    });
  };

  const handleVerifyUser = async (userId: string) => {
    try {
      const user = users.find(u => u.id === userId);
      const requested = (user as any)?.metadata?.requested_access_level as 'standard' | 'administrative' | 'read' | 'write' | 'admin' | undefined;
      // Backward compatible mapping
      const mapped:
        | 'read'
        | 'write'
        | 'admin' = requested === 'administrative'
          ? 'admin'
          : requested === 'write'
            ? 'write'
            : 'read';

      const { error } = await supabase
        .from('profiles')
        .update({ 
          verification_status: 'verified',
          is_approved: true,
          access_level: mapped
        })
        .eq('id', userId);

      if (error) throw error;

      // Ensure admin role is assigned if administrative was requested/mapped
      if (mapped === 'admin') {
        const { error: roleErr } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'admin' });
        if (roleErr) throw roleErr;
      }

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

  // Enhanced admin control handlers
  const handleFixAccount = async (userId: string) => {
    const result = await adminControls.fixUserAccount(userId);
    if (result.success) {
      loadUsers();
    }
  };

  const handleSuspend = (userId: string) => {
    const user = users.find(u => u.id === userId);
    setSelectedUser(user || null);
    setSuspendDialogOpen(true);
  };

  const handleSuspendConfirm = async (userId: string, reason: string) => {
    const result = await adminControls.suspendUser(userId, reason);
    if (result.success) {
      loadUsers();
    }
  };

  const handleUnsuspend = async (userId: string) => {
    const result = await adminControls.unsuspendUser(userId);
    if (result.success) {
      loadUsers();
    }
  };

  const handleEditProfile = (user: User) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const handleUpdateProfile = async (userId: string, updates: any) => {
    const result = await adminControls.updateUserProfile(userId, updates);
    if (result.success) {
      loadUsers();
    }
  };

  const handleResetPassword = async (email: string) => {
    await adminControls.sendPasswordReset(email);
  };

  const handleOverrideVerification = (userId: string) => {
    const user = users.find(u => u.id === userId);
    setSelectedUser(user || null);
    setVerificationDialogOpen(true);
  };

  const handleOverrideConfirm = async (
    userId: string,
    status: string,
    approved: boolean,
    accessLevel: string
  ) => {
    const result = await adminControls.overrideVerification(
      userId,
      status as 'pending' | 'verified' | 'rejected',
      approved,
      accessLevel
    );
    if (result.success) {
      loadUsers();
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
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                User Management Dashboard
              </DialogTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualRefresh}
                disabled={refreshing}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
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

            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  All ({users.length})
                </TabsTrigger>
                <TabsTrigger value="pending" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Pending ({pendingUsers.length})
                </TabsTrigger>
                <TabsTrigger value="verified" className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Verified ({verifiedUsers.length})
                </TabsTrigger>
                <TabsTrigger value="admins" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Admins ({adminUsers.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-4">
                <AllUsersSection
                  users={filteredUsers}
                  loading={loading}
                  currentUserId={currentUserId}
                  onPromoteToAdmin={(user) => initiateAdminChange(user, 'promote')}
                  onDemoteFromAdmin={(user) => initiateAdminChange(user, 'demote')}
                  onFixAccount={handleFixAccount}
                  onSuspend={handleSuspend}
                  onUnsuspend={handleUnsuspend}
                  onEditProfile={handleEditProfile}
                  onResetPassword={handleResetPassword}
                  onOverrideVerification={handleOverrideVerification}
                />
              </TabsContent>

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
                  onFixAccount={handleFixAccount}
                  onSuspend={handleSuspend}
                  onUnsuspend={handleUnsuspend}
                  onEditProfile={handleEditProfile}
                  onResetPassword={handleResetPassword}
                  onOverrideVerification={handleOverrideVerification}
                />
              </TabsContent>

              <TabsContent value="admins" className="mt-4">
                <AdminUsersSection
                  users={adminUsers}
                  loading={loading}
                  currentUserId={currentUserId}
                  onDemoteFromAdmin={(user) => initiateAdminChange(user, 'demote')}
                  onFixAccount={handleFixAccount}
                  onSuspend={handleSuspend}
                  onUnsuspend={handleUnsuspend}
                  onEditProfile={handleEditProfile}
                  onResetPassword={handleResetPassword}
                  onOverrideVerification={handleOverrideVerification}
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

      <EditUserDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        user={selectedUser}
        onSave={handleUpdateProfile}
      />

      <SuspendUserDialog
        open={suspendDialogOpen}
        onOpenChange={setSuspendDialogOpen}
        user={selectedUser}
        onConfirm={handleSuspendConfirm}
      />

      <VerificationOverrideDialog
        open={verificationDialogOpen}
        onOpenChange={setVerificationDialogOpen}
        user={selectedUser}
        onConfirm={handleOverrideConfirm}
      />
    </>
  );
}