import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  Users, 
  UserPlus, 
  Shield, 
  Edit, 
  Trash2, 
  Crown, 
  Gavel, 
  ClipboardList, 
  Key, 
  Building, 
  Package,
  RefreshCw,
  Search,
  Filter
} from "lucide-react";

export type UserRole = 'admin' | 'standard';

interface UserRoleData {
  id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
    email: string;
    department: string;
  };
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
    color: 'bg-red-100 text-red-800 border-red-200',
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
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    permissions: [
      'View assigned resources',
      'Access basic features',
      'Update personal profile',
      'View public information'
    ]
  }
};

export function RoleManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userRoles, setUserRoles] = useState<UserRoleData[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('standard');
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);

  useEffect(() => {
    loadUserRoles();
    loadCurrentUserRole();
    loadAvailableUsers();
  }, [user]);

  const loadCurrentUserRole = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setCurrentUserRole(data?.role || null);
    } catch (error) {
      console.error('Error loading current user role:', error);
    }
  };

  const loadUserRoles = async () => {
    try {
      setIsLoading(true);
      
      // Load user roles first
      const { data: userRoles, error: userRolesError } = await supabase
        .from('user_roles')
        .select('id, user_id, role, created_at')
        .order('created_at', { ascending: false });

      if (userRolesError) throw userRolesError;

      // Load profiles separately
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, department')
        .eq('is_approved', true);

      if (profilesError) throw profilesError;

      // Load court personnel from term_personnel table (they don't have assignable roles)
      const { data: courtPersonnel, error: courtError } = await supabase
        .from('term_personnel')
        .select('*')
        .order('name');

      if (courtError) throw courtError;

      // Map court personnel to display format (but they can't be assigned roles)
      const courtPersonnelDisplay = (courtPersonnel || []).map(person => {
        const nameParts = person.name.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        return {
          id: `court_${person.id}`,
          user_id: person.id,
          role: 'standard' as UserRole, // Court personnel are shown as standard for display
          created_at: person.created_at || new Date().toISOString(),
          profiles: {
            first_name: firstName,
            last_name: lastName,
            email: `${person.name.toLowerCase().replace(/\s+/g, '.')}@court.nysc.gov`,
            department: 'Court Administration'
          }
        };
      });

      // Join user roles with profiles manually
      const joinedUserRoles = (userRoles || []).map(userRole => {
        const profile = profiles?.find(p => p.id === userRole.user_id);
        return {
          ...userRole,
          profiles: profile ? {
            first_name: profile.first_name,
            last_name: profile.last_name,
            email: profile.email,
            department: profile.department
          } : undefined
        };
      }).filter(userRole => userRole.profiles); // Only include roles with valid profiles

      setUserRoles(joinedUserRoles);
    } catch (error) {
      console.error('Error loading user roles:', error);
      toast({
        title: "Error",
        description: "Failed to load user roles",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableUsers = async () => {
    try {
      // Load from individual tables since unified view doesn't exist
      let availablePersonnel = [];
      
      console.log('Loading personnel from individual tables');
        
        // Fallback: Load from individual tables
        const [profilesResult, personnelResult] = await Promise.allSettled([
          supabase
            .from('profiles')
            .select('id, first_name, last_name, email, phone, department, title')
            .eq('is_approved', true)
            .order('first_name'),
          supabase
            .from('term_personnel')
            .select('id, name, phone, role')
            .order('name')
        ]);
        
        const profiles = profilesResult.status === 'fulfilled' ? profilesResult.value.data || [] : [];
        const personnel = personnelResult.status === 'fulfilled' ? personnelResult.value.data || [] : [];
        
        // Transform to unified format
        const transformedProfiles = profiles.map(p => ({
          personnel_type: 'registered_user',
          unified_id: `user_${p.id}`,
          source_id: p.id,
          first_name: p.first_name,
          last_name: p.last_name,
          full_name: `${p.first_name || ''} ${p.last_name || ''}`.trim(),
          email: p.email,
          phone: p.phone,
          department: p.department,
          role: p.title,
          title: p.title,
          status: 'active'
        }));
        
        const transformedPersonnel = personnel.map(p => {
          const nameParts = p.name.split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';
          
          return {
            personnel_type: 'court_personnel',
            unified_id: `court_${p.id}`,
            source_id: p.id,
            first_name: firstName,
            last_name: lastName,
            full_name: p.name,
            email: `${p.name.toLowerCase().replace(/\s+/g, '.')}@court.nysc.gov`,
            phone: p.phone,
            department: 'Court Administration',
            role: p.role,
            title: p.role,
            status: 'active'
          };
        });
        
        availablePersonnel = [...transformedProfiles, ...transformedPersonnel];
      
      setAvailableUsers(availablePersonnel);
    } catch (error) {
      console.error('Error loading available users:', error);
      toast({
        title: "Error",
        description: "Failed to load available users",
        variant: "destructive",
      });
    }
  };

  const assignRole = async () => {
    if (!selectedUserId || !selectedRole || !user?.id) return;

    try {
      // Extract the actual user ID from the unified ID format
      let actualUserId = selectedUserId;
      let isCourtPersonnel = false;
      
      if (selectedUserId.startsWith('user_')) {
        actualUserId = selectedUserId.replace('user_', '');
      } else if (selectedUserId.startsWith('court_')) {
        actualUserId = selectedUserId.replace('court_', '');
        isCourtPersonnel = true;
      }
      
      // Only allow role assignment to registered users (not court personnel)
      if (isCourtPersonnel) {
        toast({
          title: "Cannot Assign Role",
          description: "Court personnel roles are managed through the personnel system. Only registered users can be assigned roles here.",
          variant: "destructive",
        });
        return;
      }

      // Check if user already has a role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', actualUserId)
        .maybeSingle();

      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from('user_roles')
          .update({
            role: selectedRole
          })
          .eq('user_id', actualUserId);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Role updated successfully",
        });
      } else {
        // Insert new role
        const { error } = await supabase
          .from('user_roles')
          .insert({
            user_id: actualUserId,
            role: selectedRole
          });

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Role assigned successfully",
        });
      }

      setIsAssignDialogOpen(false);
      setSelectedUserId('');
      setSelectedRole('standard');
      loadUserRoles();
    } catch (error) {
      console.error('Error assigning role:', error);
      toast({
        title: "Error",
        description: "Failed to assign role. Please try again.",
        variant: "destructive",
      });
    }
  };

  const removeRole = async (roleId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Role removed successfully",
      });

      loadUserRoles();
    } catch (error) {
      console.error('Error removing role:', error);
      toast({
        title: "Error",
        description: "Failed to remove role",
        variant: "destructive",
      });
    }
  };

  const filteredRoles = userRoles.filter(userRole => {
    const fullName = `${userRole.profiles.first_name || ''} ${userRole.profiles.last_name || ''}`.trim();
    const matchesSearch = fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         userRole.profiles.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         roleDefinitions[userRole.role].label.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = roleFilter === 'all' || userRole.role === roleFilter;
    
    return matchesSearch && matchesFilter;
  });

  const isAdmin = currentUserRole === 'admin';

  return (
    <div className="space-y-6">
      {/* Current User Role */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Your Current Role
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentUserRole ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {(() => {
                  const IconComponent = roleDefinitions[currentUserRole].icon;
                  return <IconComponent className="h-5 w-5" />;
                })()}
                <Badge className={roleDefinitions[currentUserRole].color}>
                  {roleDefinitions[currentUserRole].label}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                {roleDefinitions[currentUserRole].description}
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              No role assigned. Contact an administrator to request role assignment.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Definitions */}
      <Card>
        <CardHeader>
          <CardTitle>Available Roles</CardTitle>
          <CardDescription>
            Overview of all available roles and their permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(roleDefinitions).map(([role, definition]) => {
              const IconComponent = definition.icon;
              return (
                <div key={role} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <IconComponent className="h-4 w-4" />
                    <Badge className={definition.color}>
                      {definition.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {definition.description}
                  </p>
                  <div className="space-y-1">
                    <p className="text-xs font-medium">Permissions:</p>
                    <ul className="text-xs text-muted-foreground space-y-0.5">
                      {definition.permissions.map((permission, index) => (
                        <li key={index}>• {permission}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Role Management (Admin Only) */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Role Management
                </CardTitle>
                <CardDescription>
                  Assign and manage user roles
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={loadUserRoles} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
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
                        <Label>User</Label>
                        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a user" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableUsers.map((user) => (
                              <SelectItem key={user.unified_id || user.source_id} value={user.unified_id || user.source_id}>
                                <div>
                                  <div className="font-medium">{user.full_name}</div>
                                  <div className="text-sm text-muted-foreground">{user.email || 'No email'}</div>
                                  <div className="text-xs text-blue-600">{user.personnel_type === 'court_personnel' ? 'Court Personnel' : 'Registered User'}</div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Role</Label>
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
                        <Button onClick={assignRole} disabled={!selectedUserId}>
                          Assign Role
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search and Filter */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users or roles..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={roleFilter} onValueChange={(value: UserRole | 'all') => setRoleFilter(value)}>
                  <SelectTrigger className="w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {Object.entries(roleDefinitions).map(([role, definition]) => (
                      <SelectItem key={role} value={role}>
                        {definition.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* User Roles Table */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Assigned</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          <div className="flex items-center justify-center">
                            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                            Loading roles...
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredRoles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No user roles found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRoles.map((userRole) => {
                        const IconComponent = roleDefinitions[userRole.role].icon;
                        return (
                          <TableRow key={userRole.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{`${userRole.profiles.first_name || ''} ${userRole.profiles.last_name || ''}`.trim()}</div>
                                <div className="text-sm text-muted-foreground">{userRole.profiles.email}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <IconComponent className="h-4 w-4" />
                                <Badge className={roleDefinitions[userRole.role].color}>
                                  {roleDefinitions[userRole.role].label}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              {userRole.profiles.department || 'Not specified'}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {new Date(userRole.created_at).toLocaleDateString()}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button variant="outline" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Remove Role</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to remove the role from {`${userRole.profiles.first_name || ''} ${userRole.profiles.last_name || ''}`.trim()}? 
                                        This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => removeRole(userRole.id)}>
                                        Remove Role
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
