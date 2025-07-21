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

export type CourtRole = 
  | 'admin'
  | 'judge'
  | 'court_aide' 
  | 'clerk'
  | 'sergeant'
  | 'court_officer'
  | 'bailiff'
  | 'court_reporter'
  | 'administrative_assistant'
  | 'facilities_manager'
  | 'supply_room_staff';

interface UserRole {
  id: string;
  user_id: string;
  role: CourtRole;
  assigned_by: string;
  assigned_at: string;
  profiles: {
    full_name: string;
    email: string;
    department: string;
  };
}

const roleDefinitions: Record<CourtRole, { 
  label: string; 
  description: string; 
  icon: any; 
  color: string;
  permissions: string[];
}> = {
  admin: {
    label: 'System Administrator',
    description: 'Full system access and user management',
    icon: Crown,
    color: 'bg-red-100 text-red-800 border-red-200',
    permissions: ['All system permissions', 'User management', 'System configuration']
  },
  judge: {
    label: 'Judge',
    description: 'Court proceedings and case management',
    icon: Gavel,
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    permissions: ['Court operations', 'Case management', 'Courtroom access']
  },
  court_aide: {
    label: 'Court Aide',
    description: 'Assists judges and court operations',
    icon: Users,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    permissions: ['Court support', 'Document management', 'Schedule coordination']
  },
  clerk: {
    label: 'Court Clerk',
    description: 'Administrative and record keeping duties',
    icon: ClipboardList,
    color: 'bg-green-100 text-green-800 border-green-200',
    permissions: ['Record management', 'Administrative tasks', 'Document filing']
  },
  sergeant: {
    label: 'Court Sergeant',
    description: 'Security and order maintenance',
    icon: Shield,
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    permissions: ['Security management', 'Order maintenance', 'Safety protocols']
  },
  court_officer: {
    label: 'Court Officer',
    description: 'Law enforcement and security',
    icon: Shield,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    permissions: ['Security enforcement', 'Crowd control', 'Safety oversight']
  },
  bailiff: {
    label: 'Bailiff',
    description: 'Court security and prisoner transport',
    icon: Shield,
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    permissions: ['Prisoner transport', 'Court security', 'Evidence handling']
  },
  court_reporter: {
    label: 'Court Reporter',
    description: 'Transcription and record keeping',
    icon: ClipboardList,
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    permissions: ['Transcription services', 'Record keeping', 'Audio management']
  },
  administrative_assistant: {
    label: 'Administrative Assistant',
    description: 'General administrative support',
    icon: Users,
    color: 'bg-pink-100 text-pink-800 border-pink-200',
    permissions: ['Administrative support', 'Scheduling', 'Communication']
  },
  facilities_manager: {
    label: 'Facilities Manager',
    description: 'Building and facility management',
    icon: Building,
    color: 'bg-teal-100 text-teal-800 border-teal-200',
    permissions: ['Facility management', 'Maintenance oversight', 'Space allocation']
  },
  supply_room_staff: {
    label: 'Supply Room Staff',
    description: 'Inventory and supply management',
    icon: Package,
    color: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    permissions: ['Inventory management', 'Supply distribution', 'Stock monitoring']
  }
};

export function RoleManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<CourtRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<CourtRole | 'all'>('all');
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<CourtRole>('court_aide');
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
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          id,
          user_id,
          role,
          assigned_by,
          assigned_at,
          profiles!user_roles_user_id_fkey (
            full_name,
            email,
            department
          )
        `)
        .order('assigned_at', { ascending: false });

      if (error) throw error;
      setUserRoles(data || []);
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
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, department')
        .order('full_name');

      if (error) throw error;
      setAvailableUsers(data || []);
    } catch (error) {
      console.error('Error loading available users:', error);
    }
  };

  const assignRole = async () => {
    if (!selectedUserId || !selectedRole || !user?.id) return;

    try {
      // Check if user already has a role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', selectedUserId)
        .maybeSingle();

      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from('user_roles')
          .update({
            role: selectedRole,
            assigned_by: user.id,
            assigned_at: new Date().toISOString()
          })
          .eq('user_id', selectedUserId);

        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from('user_roles')
          .insert({
            user_id: selectedUserId,
            role: selectedRole,
            assigned_by: user.id,
            assigned_at: new Date().toISOString()
          });

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Role assigned successfully",
      });

      setIsAssignDialogOpen(false);
      setSelectedUserId('');
      setSelectedRole('court_aide');
      loadUserRoles();
    } catch (error) {
      console.error('Error assigning role:', error);
      toast({
        title: "Error",
        description: "Failed to assign role",
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
    const matchesSearch = userRole.profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
                              <SelectItem key={user.id} value={user.id}>
                                <div>
                                  <div className="font-medium">{user.full_name}</div>
                                  <div className="text-sm text-muted-foreground">{user.email}</div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Role</Label>
                        <Select value={selectedRole} onValueChange={(value: CourtRole) => setSelectedRole(value)}>
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
                <Select value={roleFilter} onValueChange={(value: CourtRole | 'all') => setRoleFilter(value)}>
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
                                <div className="font-medium">{userRole.profiles.full_name}</div>
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
                                {new Date(userRole.assigned_at).toLocaleDateString()}
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
                                        Are you sure you want to remove the role from {userRole.profiles.full_name}? 
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
