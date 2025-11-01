import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Users, Pencil, Shield, Search, RefreshCw, Clock, CheckCircle, XCircle, User } from "lucide-react";
import { CourtRole } from "@/hooks/useRolePermissions";
import { getRoleFromTitle, getRoleDescriptionFromTitle, getAccessDescriptionFromTitle } from "@/utils/titleToRoleMapping";

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  title: string | null;
  department: string | null;
  role: string | null;
  created_at: string;
}

import { SYSTEM_ROLES, getRoleLabel, getRoleBadgeClasses } from "@/config/roles";

interface VerificationRequest {
  id: string;
  user_id: string;
  requested_role: string;
  status: string;
  request_notes: string | null;
  admin_notes: string | null;
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
    department: string | null;
    title: string | null;
  };
}

export function UserManagementTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editRole, setEditRole] = useState<CourtRole | "">("");
  const [detectedRole, setDetectedRole] = useState<string>("");
  
  // Verification queue state
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [selectedRole, setSelectedRole] = useState('standard');
  
  const queryClient = useQueryClient();

  // Fetch pending verification requests
  const { data: verificationRequests } = useQuery({
    queryKey: ['verification-requests', 'pending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('verification_requests')
        .select(`
          *,
          profiles (
            full_name,
            email,
            department,
            title
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as VerificationRequest[];
    },
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async ({ userId, role, notes }: { userId: string; role: string; notes: string }) => {
      const { data, error } = await supabase.rpc('approve_user_verification', {
        p_user_id: userId,
        p_role: role,
        p_admin_notes: notes,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('User approved successfully');
      queryClient.invalidateQueries({ queryKey: ['verification-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setSelectedRequest(null);
      setActionType(null);
      setAdminNotes('');
    },
    onError: (error: any) => {
      toast.error('Failed to approve user', { description: error.message });
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ userId, notes }: { userId: string; notes: string }) => {
      const { data, error } = await supabase.rpc('reject_user_verification', {
        p_user_id: userId,
        p_admin_notes: notes,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('User verification rejected');
      queryClient.invalidateQueries({ queryKey: ['verification-requests'] });
      setSelectedRequest(null);
      setActionType(null);
      setAdminNotes('');
    },
    onError: (error: any) => {
      toast.error('Failed to reject user', { description: error.message });
    },
  });

  // Fetch all users
  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email, title, department, created_at")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Get roles for each user
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Merge profiles with roles
      const usersWithRoles = profiles?.map(profile => ({
        ...profile,
        role: roles?.find(r => r.user_id === profile.id)?.role || null,
      })) || [];

      return usersWithRoles as UserProfile[];
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, title, role }: { userId: string; title: string; role: CourtRole }) => {
      console.log("[UserManagement] Updating user:", { userId, title, role });

      // Update profile title
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ title, updated_at: new Date().toISOString() })
        .eq("id", userId);

      if (profileError) {
        console.error("[UserManagement] Profile update error:", profileError);
        throw new Error(`Failed to update profile: ${profileError.message}`);
      }

      console.log("[UserManagement] Profile updated successfully");

      // Try to use RPC function to update role (bypasses RLS issues)
      try {
        const { data: rpcResult, error: rpcError } = await supabase.rpc('admin_update_user_role', {
          target_user_id: userId,
          new_role: role
        });

        if (rpcError) {
          console.warn("[UserManagement] RPC function not available, using direct update:", rpcError);
          
          // Fallback to direct update
          const { data: existingRole } = await supabase
            .from("user_roles")
            .select("user_id")
            .eq("user_id", userId)
            .maybeSingle();

          if (existingRole) {
            // Update existing role
            const { error: updateError } = await supabase
              .from("user_roles")
              .update({ role })
              .eq("user_id", userId);

            if (updateError) {
              console.error("[UserManagement] Role update error:", updateError);
              throw new Error(`Failed to update role: ${updateError.message}`);
            }
          } else {
            // Insert new role
            const { error: insertError } = await supabase
              .from("user_roles")
              .insert({ user_id: userId, role });

            if (insertError) {
              console.error("[UserManagement] Role insert error:", insertError);
              throw new Error(`Failed to insert role: ${insertError.message}`);
            }
          }
        } else {
          console.log("[UserManagement] Role updated via RPC successfully");
        }
      } catch (err: any) {
        console.error("[UserManagement] Error updating role:", err);
        throw err;
      }

      return { userId, title, role };
    },
    onSuccess: (data) => {
      toast.success(`User updated successfully! Role: ${data.role}`, {
        description: "Changes will appear after refresh",
      });
      // Force refetch instead of just invalidate
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      refetch(); // Force immediate refresh
      setEditingUser(null);
      setEditTitle("");
      setEditRole("");
      setDetectedRole("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update user");
    },
  });

  const handleEditUser = (user: UserProfile) => {
    setEditingUser(user);
    setEditTitle(user.title || "");
    setEditRole((user.role as CourtRole) || "");
    
    if (user.title) {
      const detected = getRoleDescriptionFromTitle(user.title);
      setDetectedRole(detected);
    }
  };

  const handleTitleChange = (newTitle: string) => {
    setEditTitle(newTitle);
    if (newTitle) {
      const detected = getRoleDescriptionFromTitle(newTitle);
      const detectedRoleValue = getRoleFromTitle(newTitle);
      setDetectedRole(detected);
      setEditRole(detectedRoleValue);
    } else {
      setDetectedRole("");
    }
  };

  const handleSaveUser = () => {
    if (!editingUser || !editRole) {
      toast.error("Please select a role");
      return;
    }

    updateUserMutation.mutate({
      userId: editingUser.id,
      title: editTitle,
      role: editRole as CourtRole,
    });
  };

  const handleOpenDialog = (request: VerificationRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setActionType(action);
    setAdminNotes('');
    setSelectedRole(request.requested_role || 'standard');
  };

  const handleCloseDialog = () => {
    setSelectedRequest(null);
    setActionType(null);
    setAdminNotes('');
    setSelectedRole('standard');
  };

  const handleConfirmAction = () => {
    if (!selectedRequest) return;

    if (actionType === 'approve') {
      approveMutation.mutate({
        userId: selectedRequest.user_id,
        role: selectedRole,
        notes: adminNotes,
      });
    } else if (actionType === 'reject') {
      rejectMutation.mutate({
        userId: selectedRequest.user_id,
        notes: adminNotes,
      });
    }
  };

  const filteredUsers = users?.filter(user => {
    const searchLower = searchQuery.toLowerCase();
    return (
      user.first_name?.toLowerCase().includes(searchLower) ||
      user.last_name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.title?.toLowerCase().includes(searchLower) ||
      user.department?.toLowerCase().includes(searchLower)
    );
  });

  // Helper functions imported from @/config/roles

  return (
    <div className="space-y-6">
      {/* Verification Queue Section */}
      {verificationRequests && verificationRequests.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <Clock className="h-5 w-5" />
              Pending User Verifications
              <Badge variant="secondary" className="ml-2">
                {verificationRequests.length}
              </Badge>
            </CardTitle>
            <CardDescription className="text-orange-700">
              New users waiting for approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {verificationRequests.map((request) => (
                <div
                  key={request.id}
                  className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">
                          {request.profiles.full_name || 'No name provided'}
                        </h4>
                        <Badge variant="outline">{request.requested_role}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {request.profiles.email}
                      </p>
                      {request.profiles.title && (
                        <p className="text-sm">
                          <span className="font-medium">Title:</span>{' '}
                          {request.profiles.title}
                        </p>
                      )}
                      {request.profiles.department && (
                        <p className="text-sm">
                          <span className="font-medium">Department:</span>{' '}
                          {request.profiles.department}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Requested {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleOpenDialog(request, 'approve')}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleOpenDialog(request, 'reject')}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing User Management Card */}
      <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management
            </CardTitle>
            <CardDescription>
              Manage user titles and access levels
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name, email, title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="rounded-md border">
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Current Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : filteredUsers && filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.first_name} {user.last_name}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.email}
                      </TableCell>
                      <TableCell>
                        {user.title ? (
                          <span className="text-sm">{user.title}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">No title</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.department || <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        {user.role ? (
                          <Badge variant="outline" className={getRoleBadgeClasses(user.role)}>
                            {getRoleLabel(user.role)}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">No role assigned</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditUser(user)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Edit User Access</DialogTitle>
                              <DialogDescription>
                                Update {user.first_name}'s job title and access level
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label htmlFor="title">Job Title</Label>
                                <Input
                                  id="title"
                                  value={editTitle}
                                  onChange={(e) => handleTitleChange(e.target.value)}
                                  placeholder="e.g., Supply Clerk"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="role">Access Level</Label>
                                <Select
                                  value={editRole}
                                  onValueChange={(value) => setEditRole(value as any)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Choose access level" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {SYSTEM_ROLES.map((role) => (
                                      <SelectItem key={role.value} value={role.value}>
                                        <div className="flex flex-col py-1">
                                          <span className="font-semibold">{role.label}</span>
                                          <span className="text-xs text-muted-foreground">{role.description}</span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                                <Shield className="h-4 w-4 text-primary" />
                                <p className="text-xs text-muted-foreground">
                                  Changes apply immediately. User may need to refresh their browser.
                                </p>
                              </div>
                            </div>
                            <div className="flex justify-end gap-2">
                              <DialogTrigger asChild>
                                <Button variant="outline">Cancel</Button>
                              </DialogTrigger>
                              <Button
                                onClick={handleSaveUser}
                                disabled={updateUserMutation.isPending}
                              >
                                {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">Total Users</CardDescription>
              <CardTitle className="text-2xl">{users?.length || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">Admins</CardDescription>
              <CardTitle className="text-2xl">
                {users?.filter(u => u.role === "admin").length || 0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">Supply Staff</CardDescription>
              <CardTitle className="text-2xl">
                {users?.filter(u => u.role === "supply_room_staff").length || 0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">No Role</CardDescription>
              <CardTitle className="text-2xl">
                {users?.filter(u => !u.role).length || 0}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      </CardContent>
    </Card>

      {/* Approval/Rejection Dialog */}
      <Dialog open={!!selectedRequest && !!actionType} onOpenChange={handleCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approve User' : 'Reject User'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve'
                ? `Approve ${selectedRequest?.profiles.full_name || 'this user'} and assign a role`
                : `Reject ${selectedRequest?.profiles.full_name || 'this user'}'s verification request`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {actionType === 'approve' && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Assign Role</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SYSTEM_ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {actionType === 'approve' ? 'Approval Notes (Optional)' : 'Rejection Reason'}
              </Label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder={
                  actionType === 'approve'
                    ? 'Add any notes about this approval...'
                    : 'Explain why this request is being rejected...'
                }
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button
              variant={actionType === 'approve' ? 'default' : 'destructive'}
              onClick={handleConfirmAction}
              disabled={approveMutation.isPending || rejectMutation.isPending}
            >
              {approveMutation.isPending || rejectMutation.isPending
                ? 'Processing...'
                : actionType === 'approve'
                ? 'Approve User'
                : 'Reject User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
