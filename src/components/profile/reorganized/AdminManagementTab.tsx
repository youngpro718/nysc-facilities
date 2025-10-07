import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Shield, UserCheck, Settings, Crown, Info, UserPlus } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useEnabledModules } from "@/hooks/useEnabledModules";
import { UnifiedPersonnelDisplay } from "@/components/admin/UnifiedPersonnelDisplay";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
// import type { CourtRole } from '@/hooks/useRolePermissions';

// Temporary scope: restrict to DB-supported roles until ua-003 expands schema
// TODO(ua-003): Align with full CourtRole set once DB/user_roles supports it
type UserRole = 'admin' | 'standard';

interface UserWithRole {
  id: string;
  full_name: string;
  email: string;
  department: string;
  role?: UserRole;
  personnel_type: 'registered_user' | 'court_personnel';
  created_at?: string;
  is_approved?: boolean;
  verification_status?: string;
}

function ModulesManagementSection() {
  const { enabledModules, updateEnabledModules, resetToDefaults, loading } = useEnabledModules();

  const moduleLabels: Record<keyof typeof enabledModules, string> = {
    spaces: 'Spaces',
    issues: 'Issues',
    occupants: 'Occupants',
    inventory: 'Inventory',
    supply_requests: 'Supply Requests',
    keys: 'Keys',
    lighting: 'Lighting',
    maintenance: 'Maintenance',
    court_operations: 'Court Operations',
    operations: 'Operations',
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Module Management
            </CardTitle>
            <CardDescription>
              Enable or disable modules visible in your navigation and pages. This affects access for your profile.
            </CardDescription>
          </div>
          <Button variant="outline" onClick={resetToDefaults} disabled={loading}>
            Reset to Defaults
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Loading modules…</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.keys(enabledModules).map((key) => {
              const k = key as keyof typeof enabledModules;
              return (
                <div key={k} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{moduleLabels[k]}</div>
                    <div className="text-xs text-muted-foreground">Module key: {k}</div>
                  </div>
                  <Switch
                    checked={!!enabledModules[k]}
                    onCheckedChange={(checked) => updateEnabledModules({ [k]: checked })}
                  />
                </div>
              );
            })}
          </div>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          Note: In development, you can set VITE_DISABLE_MODULE_GATES=true to bypass module gates for quick exploration.
        </p>
      </CardContent>
    </Card>
  );
}

const roleDefinitions: Record<UserRole, { 
  label: string; 
  description: string; 
  icon: any; 
  color: string;
  permissions: string[];
}> = {
  admin: {
    label: 'Administrator',
    description: 'Full system access and management capabilities',
    icon: Crown,
    color: 'bg-red-100 text-red-800',
    permissions: [
      'Manage all users and roles',
      'Access all system settings',
      'View all reports and analytics',
      'Manage facilities and resources',
      'Override security restrictions'
    ]
  },
  standard: {
    label: 'Standard User',
    description: 'Basic system access with limited permissions',
    icon: Users,
    color: 'bg-blue-100 text-blue-800',
    permissions: [
      'View assigned resources',
      'Access basic features',
      'Update personal profile',
      'View public information'
    ]
  }
};

export function AdminManagementTab() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('standard');
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);

  // Guard: restrict this tab to admin users only
  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Access restricted</CardTitle>
            <CardDescription>
              You do not have permission to view this section.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Load all users with their roles
  const { data: usersWithRoles = [], isLoading } = useQuery({
    queryKey: ['users-with-roles'],
    queryFn: async (): Promise<UserWithRole[]> => {
      try {
        // Get user roles first
        const { data: userRoles, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id, role, created_at');

        if (rolesError) throw rolesError;

        // Build a quick lookup for roles by user_id
        const roleMap = new Map<string, { role?: UserRole; created_at?: string }>();
        userRoles?.forEach((ur) => {
          const roleVal = (ur.role === 'admin' || ur.role === 'standard') ? (ur.role as UserRole) : undefined;
          roleMap.set(ur.user_id, { role: roleVal, created_at: ur.created_at });
        });

        // mutations moved to component scope

        // Get all profiles (approved + pending) so admins can approve new users here
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email, department, is_approved, verification_status');

        if (profilesError) throw profilesError;

        // Get court personnel (they don't have assignable roles)
        const { data: courtPersonnel, error: courtError } = await supabase
          .from('term_personnel')
          .select('*')
          .order('name');

        if (courtError) throw courtError;

        // Combine and format the data
        const allUsers: UserWithRole[] = [];

        // Start with all profiles (registered users), attach role if present
        profiles?.forEach((profile) => {
          const roleInfo = roleMap.get(profile.id);
          allUsers.push({
            id: profile.id,
            full_name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
            email: profile.email,
            department: profile.department || '',
            role: roleInfo?.role,
            personnel_type: 'registered_user',
            created_at: roleInfo?.created_at,
            is_approved: (profile as any).is_approved,
            verification_status: (profile as any).verification_status,
          });
        });

        // Add court personnel (they don't have assignable roles, just for display)
        courtPersonnel?.forEach((person) => {
          allUsers.push({
            id: `court_${person.id}`,
            full_name: person.name,
            email: `${person.name.toLowerCase().replace(/\s+/g, '.')}@court.nysc.gov`,
            department: 'Court Administration',
            role: undefined, // Court personnel don't have assignable roles
            personnel_type: 'court_personnel'
          });
        });

        return allUsers;
      } catch (error) {
        console.error('Error fetching users with roles:', error);
        throw error;
      }
    },
  });

  // Derived selection after data is available
  const selectedUser = usersWithRoles?.find(u => u.id === selectedUserId);

  // Approve a registered user (sets verified + read access)
  const approveUser = useMutation({
    mutationFn: async (userId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('profiles')
        .update({ is_approved: true, verification_status: 'verified', access_level: 'read' })
        .eq('id', userId);
      if (error) throw error;
      // Emit admin notification (non-blocking)
      try {
        const { error: emitError } = await (supabase as any).rpc('emit_admin_notification', {
          p_type: 'user_approved',
          p_title: 'User Approved',
          p_message: `User ${userId} was approved`,
          p_urgency: 'medium',
          p_related_table: 'profiles',
          p_related_id: userId,
          p_metadata: { actor_id: user.id, target_user_id: userId }
        });
        if (emitError) console.warn('emit_admin_notification failed (approve):', emitError);
      } catch (e) {
        console.warn('emit_admin_notification threw (approve):', e);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      toast({ title: 'User approved', description: 'The user has been approved and granted read access.' });
    },
    onError: (error) => {
      console.error('Error approving user:', error);
      toast({ title: 'Error', description: 'Failed to approve user', variant: 'destructive' });
    }
  });

  // Reject a registered user (marks as rejected)
  const rejectUser = useMutation({
    mutationFn: async (userId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('profiles')
        .update({ is_approved: false, verification_status: 'rejected' })
        .eq('id', userId);
      if (error) throw error;
      // Emit admin notification (non-blocking)
      try {
        const { error: emitError } = await (supabase as any).rpc('emit_admin_notification', {
          p_type: 'user_rejected',
          p_title: 'User Rejected',
          p_message: `User ${userId} was rejected`,
          p_urgency: 'high',
          p_related_table: 'profiles',
          p_related_id: userId,
          p_metadata: { actor_id: user.id, target_user_id: userId }
        });
        if (emitError) console.warn('emit_admin_notification failed (reject):', emitError);
      } catch (e) {
        console.warn('emit_admin_notification threw (reject):', e);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      toast({ title: 'User rejected', description: 'The user has been marked as rejected.' });
    },
    onError: (error) => {
      console.error('Error rejecting user:', error);
      toast({ title: 'Error', description: 'Failed to reject user', variant: 'destructive' });
    }
  });

  // Get role statistics
  const roleStats = usersWithRoles.reduce((acc, user) => {
    if (user.role) {
      acc[user.role] = (acc[user.role] || 0) + 1;
    }
    return acc;
  }, {} as Record<UserRole, number>);

  const assignRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Check if user already has a role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existingRole) {
        // Update existing role using the primary key (id)
        const { error } = await supabase
          .from('user_roles')
          .update({
            role: role
          })
          .eq('id', existingRole.id);

        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role: role
          });

        if (error) throw error;
      }
      // Emit admin notification (non-blocking)
      try {
        const { error: emitError } = await (supabase as any).rpc('emit_admin_notification', {
          p_type: 'role_assigned',
          p_title: 'Role Assigned',
          p_message: `Role ${role} assigned to user ${userId}`,
          p_urgency: 'medium',
          p_related_table: 'user_roles',
          p_related_id: userId,
          p_metadata: { actor_id: user.id, target_user_id: userId, role }
        });
        if (emitError) console.warn('emit_admin_notification failed (assign):', emitError);
      } catch (e) {
        console.warn('emit_admin_notification threw (assign):', e);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      setIsAssignDialogOpen(false);
      setSelectedUserId('');
      toast({
        title: "Success",
        description: "Role assigned successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to assign role",
        variant: "destructive",
      });
      console.error('Error assigning role:', error);
    },
  });

  const removeRole = useMutation({
    mutationFn: async (userId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);
      if (error) throw error;
      // Emit admin notification (non-blocking)
      try {
        const { error: emitError } = await (supabase as any).rpc('emit_admin_notification', {
          p_type: 'role_removed',
          p_title: 'Role Removed',
          p_message: `Role removed from user ${userId}`,
          p_urgency: 'low',
          p_related_table: 'user_roles',
          p_related_id: userId,
          p_metadata: { actor_id: user.id, target_user_id: userId }
        });
        if (emitError) console.warn('emit_admin_notification failed (remove):', emitError);
      } catch (e) {
        console.warn('emit_admin_notification threw (remove):', e);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      toast({
        title: "Success",
        description: "Role removed successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to remove role",
        variant: "destructive",
      });
      console.error('Error removing role:', error);
    },
  });

  const handleAssignRole = () => {
    if (selectedUserId && selectedRole) {
      assignRole.mutate({ userId: selectedUserId, role: selectedRole });
    }
  };

  const handleRemoveRole = (userId: string) => {
    if (window.confirm('Remove role from this user?')) {
      removeRole.mutate(userId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Personnel</p>
                <p className="text-2xl font-bold">{usersWithRoles.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Registered Users</p>
                <p className="text-2xl font-bold">{usersWithRoles.filter(u => u.personnel_type === 'registered_user').length}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Court Personnel</p>
                <p className="text-2xl font-bold">{usersWithRoles.filter(u => u.personnel_type === 'court_personnel').length}</p>
              </div>
              <Shield className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="roles" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="roles" className="gap-2">
            <Users className="h-4 w-4" />
            Role Assignments
          </TabsTrigger>
          <TabsTrigger value="personnel" className="gap-2">
            <Shield className="h-4 w-4" />
            All Personnel
          </TabsTrigger>
          <TabsTrigger value="permissions" className="gap-2">
            <Settings className="h-4 w-4" />
            Role Definitions
          </TabsTrigger>
          <TabsTrigger value="modules" className="gap-2">
            <Settings className="h-4 w-4" />
            Modules
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Role Assignments
                  </CardTitle>
                  <CardDescription>
                    View and manage user role assignments
                  </CardDescription>
                </div>
                <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Assign Role
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Assign User Role</DialogTitle>
                      <DialogDescription>
                        Select a user and assign them a role
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">User</label>
                        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a user" />
                          </SelectTrigger>
                          <SelectContent>
                            {usersWithRoles
                              .filter((u) =>
                                u.personnel_type === 'registered_user' &&
                                u.verification_status === 'verified'
                              )
                              .sort((a, b) => a.full_name.localeCompare(b.full_name))
                              .map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                  <div>
                                    <div className="font-medium">{user.full_name || user.email}</div>
                                    <div className="text-sm text-muted-foreground">{user.email}</div>
                                    <div className="text-xs text-blue-600">Registered User</div>
                                  </div>
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Role</label>
                        <Select value={selectedRole} onValueChange={(value: UserRole) => setSelectedRole(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(roleDefinitions).map(([role, definition]) => (
                              <SelectItem key={role} value={role}>
                                <div className="flex items-center gap-2">
                                  <Badge className={definition.color}>
                                    {definition.label}
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleAssignRole} 
                          disabled={
                            !selectedUserId ||
                            assignRole.isPending ||
                            (selectedUser as any)?.verification_status !== 'verified'
                          }
                        >
                          {assignRole.isPending ? 'Assigning...' : 'Assign Role'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Assigned</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersWithRoles.map((user) => {
                      const roleInfo = user.role ? roleDefinitions[user.role] : null;
                      return (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.full_name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.department}</TableCell>
                          <TableCell>
                            {user.personnel_type === 'registered_user' && user.verification_status === 'rejected' ? (
                              <Badge variant="destructive">Rejected</Badge>
                            ) : user.personnel_type === 'registered_user' && (user.is_approved !== true || user.verification_status !== 'verified') ? (
                              <Badge variant="secondary">Pending Approval</Badge>
                            ) : roleInfo ? (
                              <Badge className={roleInfo.color}>
                                {roleInfo.label}
                              </Badge>
                            ) : (
                              <Badge variant="outline">No Role</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.personnel_type === 'registered_user' ? 'default' : 'secondary'}>
                              {user.personnel_type === 'registered_user' ? 'User' : 'Court'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'System'}
                          </TableCell>
                          <TableCell className="space-x-2">
                            {user.personnel_type === 'registered_user' ? (
                              user.is_approved !== true || user.verification_status !== 'verified' ? (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => approveUser.mutate(user.id)}
                                    disabled={approveUser.isPending}
                                  >
                                    {approveUser.isPending ? 'Approving...' : 'Approve'}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => rejectUser.mutate(user.id)}
                                    disabled={rejectUser.isPending}
                                  >
                                    {rejectUser.isPending ? 'Rejecting...' : 'Reject'}
                                  </Button>
                                </>
                              ) : user.role ? (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedUserId(user.id);
                                      setSelectedRole(user.role as UserRole);
                                      setIsAssignDialogOpen(true);
                                    }}
                                  >
                                    Change
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveRole(user.id)}
                                    disabled={removeRole.isPending}
                                  >
                                    {removeRole.isPending ? 'Removing...' : 'Remove'}
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedUserId(user.id);
                                    setSelectedRole('standard');
                                    setIsAssignDialogOpen(true);
                                  }}
                                  disabled={user.is_approved !== true || user.verification_status !== 'verified'}
                                >
                                  Assign
                                </Button>
                              )
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modules" className="space-y-4">
          <ModulesManagementSection />
        </TabsContent>

        <TabsContent value="personnel" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                All Personnel
              </CardTitle>
              <CardDescription>
                Complete list of all registered users and court personnel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UnifiedPersonnelDisplay />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Role Definitions
                  </CardTitle>
                  <CardDescription>
                    Overview of all available roles and their permissions
                  </CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Info className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Detailed Role Permissions</DialogTitle>
                      <DialogDescription>
                        Complete breakdown of all roles and their specific permissions
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6">
                      {Object.entries(roleDefinitions).map(([role, definition]) => {
                        const IconComponent = definition.icon;
                        return (
                          <div key={role} className="border rounded-lg p-4">
                            <div className="flex items-center gap-3 mb-3">
                              <IconComponent className="h-5 w-5" />
                              <div>
                                <h3 className="font-semibold">{definition.label}</h3>
                                <p className="text-sm text-muted-foreground">{definition.description}</p>
                              </div>
                              <Badge className={definition.color}>
                                {roleStats[role as UserRole] || 0} users
                              </Badge>
                            </div>
                            <div className="ml-8">
                              <h4 className="text-sm font-medium mb-2">Permissions:</h4>
                              <ul className="text-sm text-muted-foreground space-y-1">
                                {definition.permissions.map((permission, index) => (
                                  <li key={index} className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-current rounded-full" />
                                    {permission}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Object.entries(roleDefinitions).map(([role, definition]) => {
                  const IconComponent = definition.icon;
                  const count = roleStats[role as UserRole] || 0;
                  return (
                    <div key={role} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3 mb-2">
                        <IconComponent className="h-5 w-5" />
                        <div className="flex-1">
                          <h3 className="font-medium">{definition.label}</h3>
                          <p className="text-sm text-muted-foreground">{definition.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <Badge className={definition.color}>
                          {count} {count === 1 ? 'user' : 'users'}
                        </Badge>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              Manage
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <IconComponent className="h-5 w-5" />
                                Manage {definition.label} Role
                              </DialogTitle>
                              <DialogDescription>
                                Users currently assigned to the {definition.label} role
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              {usersWithRoles.filter(u => u.role === role).length > 0 ? (
                                <div className="space-y-2">
                                  {usersWithRoles.filter(u => u.role === role).map((user) => (
                                    <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                                      <div>
                                        <div className="font-medium">{user.full_name}</div>
                                        <div className="text-sm text-muted-foreground">{user.email}</div>
                                        <div className="text-xs text-blue-600">
                                          {user.personnel_type === 'court_personnel' ? 'Court Personnel' : 'Registered User'}
                                        </div>
                                      </div>
                                      <Badge className={definition.color}>
                                        {definition.label}
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                  <p>No users currently assigned to this role</p>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
