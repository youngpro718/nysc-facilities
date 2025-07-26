import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Shield, UserCheck, Settings, Crown, Gavel, ClipboardList, Info, UserPlus } from "lucide-react";
import { SecuritySection } from "@/components/profile/SecuritySection";
import { UnifiedPersonnelDisplay } from "@/components/admin/UnifiedPersonnelDisplay";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

type UserRole = 'admin' | 'standard';

interface UserWithRole {
  id: string;
  full_name: string;
  email: string;
  department: string;
  role?: UserRole;
  personnel_type: 'registered_user' | 'court_personnel';
  created_at?: string;
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
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('standard');
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);

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

        // Get all profiles
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email, department')
          .eq('is_approved', true);

        if (profilesError) throw profilesError;

        // Get court personnel (they don't have assignable roles)
        const { data: courtPersonnel, error: courtError } = await supabase
          .from('term_personnel')
          .select('*')
          .order('name');

        if (courtError) throw courtError;

        // Combine and format the data
        const allUsers: UserWithRole[] = [];

        // Join user roles with profiles manually
        userRoles?.forEach(userRole => {
          const profile = profiles?.find(p => p.id === userRole.user_id);
          if (profile) {
            allUsers.push({
              id: userRole.user_id,
              full_name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
              email: profile.email,
              department: profile.department || '',
              role: userRole.role as UserRole,
              personnel_type: 'registered_user',
              created_at: userRole.created_at
            });
          }
        });

        // Add court personnel (they don't have assignable roles, just for display)
        courtPersonnel?.forEach(person => {
          const nameParts = person.name.split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';
          
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
        // Update existing role
        const { error } = await supabase
          .from('user_roles')
          .update({
            role: role
          })
          .eq('user_id', userId);

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

  const handleAssignRole = () => {
    if (selectedUserId && selectedRole) {
      assignRole.mutate({ userId: selectedUserId, role: selectedRole });
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
        <TabsList className="grid w-full grid-cols-3">
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
                            {usersWithRoles.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                <div>
                                  <div className="font-medium">{user.full_name}</div>
                                  <div className="text-sm text-muted-foreground">{user.email}</div>
                                  <div className="text-xs text-blue-600">
                                    {user.personnel_type === 'court_personnel' ? 'Court Personnel' : 'Registered User'}
                                  </div>
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
                          disabled={!selectedUserId || assignRole.isPending}
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
                            {roleInfo ? (
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
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
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
