import { ChevronLeft, Users, Shield, Activity, AlertCircle, Search, RefreshCw, MoreVertical, Edit, Mail, KeyRound, UserX, UserCheck, Ban, CheckCircle, Clock, Unlock, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
import { MobileProfileHeader } from "@/components/profile/mobile/MobileProfileHeader";
import { useState, useEffect } from "react";
import { useRolePermissions } from "@/hooks/useRolePermissions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SecurityAuditPanel } from "@/components/security/SecurityAuditPanel";
import { TitleAccessManager } from "@/components/admin/TitleAccessManager";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SYSTEM_ROLES, getRoleLabel, type UserRole } from "@/config/roles";
import { supabase } from "@/lib/supabase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { AdminQuickActions } from "@/components/settings/AdminQuickActions";
import SecurityPanel from "@/components/admin/security/SecurityPanel";
import { useUserStatistics } from "@/hooks/admin/useUserStatistics";
import { useRateLimitManager } from "@/hooks/security/useRateLimitManager";

interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  title: string | null;
  verification_status: 'pending' | 'verified' | 'rejected';
  is_approved: boolean;
  is_suspended: boolean;
  suspension_reason: string | null;
  created_at: string;
  role?: UserRole;
  department?: { name: string };
}

export default function AdminCenter() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAdmin, userRole } = useRolePermissions();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'verified' | 'suspended' | 'admins'>('all');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const { resetLoginAttempts } = useRateLimitManager();
  
  const { data: stats, isLoading: statsLoading } = useUserStatistics();
  
  // Get active tab from URL or default to 'users'
  const activeTab = searchParams.get('tab') || 'users';
  
  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  useEffect(() => {
    if (activeTab === 'users') {
      loadCurrentUser();
      loadUsers();
    }
  }, [activeTab]);

  const loadCurrentUser = async () => {
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

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`*, department:departments(name)`)
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const roleMap = new Map(userRoles?.map(r => [r.user_id, r.role]) || []);
      const usersWithRoles = (profiles || []).map(profile => ({
        ...profile,
        role: roleMap.get(profile.id) as UserRole || 'standard',
        department: (profile as any).department,
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    loadUsers(true);
    toast.success('Refreshing user data...');
  };

  const handleApproveUser = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    const userName = user?.email || 'User';
    
    toast.loading('Approving user...', { id: 'approve-user' });
    
    try {
      const { error } = await supabase.rpc('approve_user_verification', {
        p_user_id: userId,
        p_role: 'standard',
        p_admin_notes: 'Approved via admin panel'
      });
      
      if (error) throw error;
      
      toast.success(`✅ ${userName} has been approved!`, { id: 'approve-user' });
      await loadUsers(true);
    } catch (error) {
      console.error('Error approving user:', error);
      toast.error(`❌ Failed to approve ${userName}`, { id: 'approve-user' });
    }
  };

  const handleRejectUser = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    const userName = user?.email || 'User';
    
    toast.loading('Rejecting user...', { id: 'reject-user' });
    
    try {
      const { error } = await supabase.rpc('reject_user_verification', {
        p_user_id: userId,
        p_admin_notes: 'Rejected via admin panel'
      });
      
      if (error) throw error;
      
      toast.success(`✅ ${userName} has been rejected`, { id: 'reject-user' });
      await loadUsers(true);
    } catch (error) {
      console.error('Error rejecting user:', error);
      toast.error(`❌ Failed to reject ${userName}`, { id: 'reject-user' });
    }
  };

  const handleUnlockAccount = async (userEmail: string) => {
    toast.loading('Unlocking account...', { id: 'unlock-account' });
    
    try {
      const success = await resetLoginAttempts(userEmail);
      
      if (success) {
        toast.success(`✅ Account unlocked for ${userEmail}`, { id: 'unlock-account' });
      } else {
        toast.error('Failed to unlock account', { id: 'unlock-account' });
      }
    } catch (error: any) {
      console.error('Error unlocking account:', error);
      toast.error(`❌ Failed to unlock account: ${error.message}`, { id: 'unlock-account' });
    }
  };

  const handleChangeRole = async (userId: string, newRole: UserRole) => {
    const user = users.find(u => u.id === userId);
    const userName = user?.first_name && user?.last_name 
      ? `${user.first_name} ${user.last_name}` 
      : user?.email || 'User';
    const roleLabel = getRoleLabel(newRole);
    
    setUpdatingUserId(userId);
    toast.loading(`Changing role to ${roleLabel}...`, { id: 'change-role' });
    
    try {
      const { data, error } = await supabase.rpc('admin_update_user_role', {
        target_user_id: userId,
        new_role: newRole
      });
      
      if (error) throw error;
      
      if (data && typeof data === 'object' && 'success' in data && !data.success) {
        throw new Error(data.message || 'Role update failed');
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      setUsers([]);
      
      toast.success(`✅ ${userName} is now a ${roleLabel}!`, { id: 'change-role' });
      await loadUsers(true);
    } catch (error: any) {
      console.error('Error changing role:', error);
      toast.error(`❌ Failed to change role for ${userName}: ${error?.message || 'Unknown error'}`, { id: 'change-role' });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      user.email?.toLowerCase().includes(searchLower) ||
      user.first_name?.toLowerCase().includes(searchLower) ||
      user.last_name?.toLowerCase().includes(searchLower);

    if (!matchesSearch) return false;

    switch (filterStatus) {
      case 'pending': return user.verification_status === 'pending' || !user.is_approved;
      case 'verified': return user.verification_status === 'verified' && user.is_approved && !user.is_suspended;
      case 'suspended': return user.is_suspended;
      case 'admins': return user.role === 'admin';
      default: return true;
    }
  });

  return (
    <div className="space-y-4 pb-20 px-3 sm:px-0">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 pt-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="h-9 w-9 flex-shrink-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl sm:text-2xl font-semibold truncate">Admin Center</h1>
        </div>
      </div>

      {/* Navigation Hint Banner */}
      <Card className="bg-muted/50 border-muted">
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              For personal settings, visit your Profile. For system configuration, use System Settings.
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" asChild>
                <Link to="/profile?tab=settings">
                  My Settings <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link to="/system-settings">
                  System Settings <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Header */}
      <MobileProfileHeader />

      {/* Admin Quick Actions */}
      {isAdmin && <AdminQuickActions />}

      {/* Main Content - 4 Tabs (removed Settings) */}
      {isAdmin ? (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="users" className="text-xs sm:text-sm relative">
              <Users className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Users</span>
              <span className="sm:hidden">👥</span>
              {users.filter(u => u.verification_status === 'pending' || !u.is_approved).length > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-bold">
                  {users.filter(u => u.verification_status === 'pending' || !u.is_approved).length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="access" className="text-xs sm:text-sm">
              <Shield className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Access</span>
              <span className="sm:hidden">🔐</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="text-xs sm:text-sm">
              <Shield className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Security</span>
              <span className="sm:hidden">🛡️</span>
            </TabsTrigger>
            <TabsTrigger value="audit" className="text-xs sm:text-sm">
              <Activity className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Audit</span>
              <span className="sm:hidden">📋</span>
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="mt-4 space-y-4">
            {/* Header Banner */}
            <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-bold">User & Role Management</h2>
                    <p className="text-sm text-muted-foreground">
                      Manage all users and their roles. Click statistics to filter, search users, and change roles instantly.
                    </p>
                  </div>
                  <Badge variant="secondary" className="hidden sm:flex">
                    {users.length} Total Users
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Card 
                className={`cursor-pointer transition-all hover:shadow-md ${filterStatus === 'all' ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setFilterStatus('all')}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">{statsLoading ? '...' : stats?.totalUsers || users.length}</div>
                  <div className="text-xs text-muted-foreground">Total Users</div>
                </CardContent>
              </Card>
              <Card 
                className={`cursor-pointer transition-all hover:shadow-md ${filterStatus === 'pending' ? 'ring-2 ring-amber-500' : ''}`}
                onClick={() => setFilterStatus('pending')}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-amber-600">{statsLoading ? '...' : stats?.pendingUsers || 0}</div>
                  <div className="text-xs text-muted-foreground">Pending</div>
                </CardContent>
              </Card>
              <Card 
                className={`cursor-pointer transition-all hover:shadow-md ${filterStatus === 'verified' ? 'ring-2 ring-green-500' : ''}`}
                onClick={() => setFilterStatus('verified')}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{statsLoading ? '...' : stats?.verifiedUsers || 0}</div>
                  <div className="text-xs text-muted-foreground">Verified</div>
                </CardContent>
              </Card>
              <Card 
                className={`cursor-pointer transition-all hover:shadow-md ${filterStatus === 'suspended' ? 'ring-2 ring-red-500' : ''}`}
                onClick={() => setFilterStatus('suspended')}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{statsLoading ? '...' : stats?.suspendedUsers || 0}</div>
                  <div className="text-xs text-muted-foreground">Suspended</div>
                </CardContent>
              </Card>
              <Card 
                className={`cursor-pointer transition-all hover:shadow-md ${filterStatus === 'admins' ? 'ring-2 ring-purple-500' : ''}`}
                onClick={() => setFilterStatus('admins')}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">{statsLoading ? '...' : stats?.adminUsers || 0}</div>
                  <div className="text-xs text-muted-foreground">Admins</div>
                </CardContent>
              </Card>
            </div>

            {/* Search and Refresh */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleManualRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            {/* Filter Info */}
            {filterStatus !== 'all' && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  Showing: {filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)} ({filteredUsers.length})
                </Badge>
                <Button variant="ghost" size="sm" onClick={() => setFilterStatus('all')}>
                  Clear filter
                </Button>
              </div>
            )}

            {/* Users List */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">All Users</CardTitle>
                <CardDescription>
                  {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No users found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredUsers.map((user) => (
                      <Card key={user.id} className="p-3">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="text-sm">
                              {(user.first_name?.[0] || '') + (user.last_name?.[0] || user.email?.[0] || '?')}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium truncate">
                                {user.first_name || user.last_name 
                                  ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                                  : 'No Name'}
                              </span>
                              {user.role === 'admin' && (
                                <Badge variant="default" className="bg-purple-600">Admin</Badge>
                              )}
                              {user.verification_status === 'pending' && (
                                <Badge variant="outline" className="text-amber-600 border-amber-600">
                                  <Clock className="h-3 w-3 mr-1" /> Pending
                                </Badge>
                              )}
                              {user.is_suspended && (
                                <Badge variant="destructive">Suspended</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                            {user.title && (
                              <p className="text-xs text-muted-foreground">{user.title}</p>
                            )}
                            
                            {/* Role Management */}
                            {user.id !== currentUserId && (
                              <div className="mt-2 flex items-center gap-2">
                                <Select
                                  value={user.role || 'standard'}
                                  onValueChange={(value) => handleChangeRole(user.id, value as UserRole)}
                                  disabled={updatingUserId === user.id}
                                >
                                  <SelectTrigger className="h-8 w-40 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {SYSTEM_ROLES.map((role) => (
                                      <SelectItem key={role.value} value={role.value}>
                                        <div className="flex items-center gap-2">
                                          <span className={`h-2 w-2 rounded-full ${
                                            role.color === 'red' ? 'bg-red-500' :
                                            role.color === 'blue' ? 'bg-blue-500' :
                                            role.color === 'green' ? 'bg-green-500' :
                                            role.color === 'purple' ? 'bg-purple-500' :
                                            role.color === 'orange' ? 'bg-orange-500' :
                                            'bg-gray-500'
                                          }`} />
                                          {role.label}
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {user.id === currentUserId && (
                                  <span className="text-xs text-muted-foreground italic">(Cannot change your own role)</span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Actions Menu */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {(user.verification_status === 'pending' || !user.is_approved) && (
                                <>
                                  <DropdownMenuItem onClick={() => handleApproveUser(user.id)}>
                                    <UserCheck className="h-4 w-4 mr-2 text-green-600" />
                                    Approve User
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleRejectUser(user.id)}>
                                    <UserX className="h-4 w-4 mr-2 text-red-600" />
                                    Reject User
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                </>
                              )}
                              <DropdownMenuItem onClick={() => handleUnlockAccount(user.email)}>
                                <Unlock className="h-4 w-4 mr-2" />
                                Unlock Account
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast.info('Edit profile coming soon')}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast.info('Send email coming soon')}>
                                <Mail className="h-4 w-4 mr-2" />
                                Send Email
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Access Tab */}
          <TabsContent value="access" className="mt-4">
            <TitleAccessManager 
              rolesCatalogOverride={[
                'admin', 'cmc', 'court_aide', 'purchasing_staff', 
                'facilities_manager', 'clerk', 'sergeant', 'standard'
              ]}
              enableCsvImport={true}
            />
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="mt-4">
            <SecurityPanel />
          </TabsContent>

          {/* Audit Tab */}
          <TabsContent value="audit" className="mt-4">
            <SecurityAuditPanel enableFilters={true} enableExport={true} pageSize={50} />
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Admin Access Required</CardTitle>
            <CardDescription>
              You are viewing as "{userRole}". Admin-only sections are hidden.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
