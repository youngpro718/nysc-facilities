import { ChevronLeft, Users, AlertCircle, Search, RefreshCw, MoreVertical, Mail, UserX, UserCheck, Clock, Unlock, CheckCircle, Ban } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from 'sonner';
import { useState, useEffect } from "react";
import { useRolePermissions } from "@/hooks/useRolePermissions";
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
} from "@/components/ui/dropdown-menu";
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
  requested_role?: string | null;
}

export default function AdminCenter() {
  const navigate = useNavigate();
  const { isAdmin, userRole } = useRolePermissions();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'active' | 'suspended' | 'admins'>('all');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [pendingRoleSelections, setPendingRoleSelections] = useState<Record<string, UserRole>>({});
  const { resetLoginAttempts } = useRateLimitManager();

  // Current admin info
  const currentAdmin = users.find(u => u.id === currentUserId);
  const currentAdminName = currentAdmin?.first_name && currentAdmin?.last_name 
    ? `${currentAdmin.first_name} ${currentAdmin.last_name}` 
    : currentAdmin?.email || 'Admin';

  useEffect(() => {
    loadCurrentUser();
    loadUsers();
  }, []);

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
        .select('*')
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

  const handleApproveUser = async (userId: string, selectedRole: UserRole) => {
    const user = users.find(u => u.id === userId);
    const userName = user?.first_name && user?.last_name 
      ? `${user.first_name} ${user.last_name}` 
      : user?.email || 'User';
    
    setUpdatingUserId(userId);
    toast.loading('Approving user...', { id: 'approve-user' });
    
    try {
      const { error } = await supabase.rpc('approve_user_verification', {
        p_user_id: userId,
        p_role: selectedRole,
        p_admin_notes: `Approved via admin panel with role: ${getRoleLabel(selectedRole)}`
      });
      
      if (error) throw error;
      
      toast.success(`✅ ${userName} approved as ${getRoleLabel(selectedRole)}!`, { id: 'approve-user' });
      setPendingRoleSelections(prev => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
      await loadUsers(true);
    } catch (error) {
      console.error('Error approving user:', error);
      toast.error(`❌ Failed to approve ${userName}`, { id: 'approve-user' });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleRejectUser = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    const userName = user?.first_name && user?.last_name 
      ? `${user.first_name} ${user.last_name}` 
      : user?.email || 'User';
    
    setUpdatingUserId(userId);
    toast.loading('Rejecting user...', { id: 'reject-user' });
    
    try {
      const { error } = await supabase.rpc('reject_user_verification', {
        p_user_id: userId,
        p_admin_notes: 'Rejected via admin panel'
      });
      
      if (error) throw error;
      
      toast.success(`${userName} has been rejected`, { id: 'reject-user' });
      await loadUsers(true);
    } catch (error) {
      console.error('Error rejecting user:', error);
      toast.error(`❌ Failed to reject ${userName}`, { id: 'reject-user' });
    } finally {
      setUpdatingUserId(null);
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
      
      toast.success(`✅ ${userName} is now a ${roleLabel}!`, { id: 'change-role' });
      await loadUsers(true);
    } catch (error: any) {
      console.error('Error changing role:', error);
      toast.error(`❌ Failed to change role: ${error?.message || 'Unknown error'}`, { id: 'change-role' });
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Separate pending and active users
  const pendingUsers = users.filter(u => u.verification_status === 'pending' || !u.is_approved);
  const activeUsers = users.filter(u => u.verification_status === 'verified' && u.is_approved && !u.is_suspended);
  const suspendedUsers = users.filter(u => u.is_suspended);

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      user.email?.toLowerCase().includes(searchLower) ||
      user.first_name?.toLowerCase().includes(searchLower) ||
      user.last_name?.toLowerCase().includes(searchLower);

    if (!matchesSearch) return false;

    switch (filterStatus) {
      case 'pending': return user.verification_status === 'pending' || !user.is_approved;
      case 'active': return user.verification_status === 'verified' && user.is_approved && !user.is_suspended;
      case 'suspended': return user.is_suspended;
      case 'admins': return user.role === 'admin';
      default: return true;
    }
  });

  const getUserDisplayName = (user: UserProfile) => {
    if (user.first_name || user.last_name) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    }
    return user.email?.split('@')[0] || 'Unknown';
  };

  const getSelectedRoleForPending = (userId: string, requestedRole?: string | null): UserRole => {
    if (pendingRoleSelections[userId]) return pendingRoleSelections[userId];
    if (requestedRole && SYSTEM_ROLES.some(r => r.value === requestedRole)) {
      return requestedRole as UserRole;
    }
    return 'standard';
  };

  if (!isAdmin) {
    return (
      <div className="space-y-4 pb-20 px-3 sm:px-0">
        <div className="flex items-center gap-2 pt-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-9 w-9">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold">User Management</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Admin Access Required</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20 px-3 sm:px-0">
      {/* Header with Admin Info */}
      <div className="flex items-center justify-between gap-2 pt-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-9 w-9 flex-shrink-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h1 className="text-xl sm:text-2xl font-semibold">User Management</h1>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleManualRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Logged in as */}
      <div className="text-sm text-muted-foreground">
        Logged in as: <span className="font-medium text-foreground">{currentAdminName}</span>
        <Badge variant="outline" className="ml-2">{getRoleLabel(userRole)}</Badge>
      </div>

      {/* Pending Users Alert */}
      {pendingUsers.length > 0 && (
        <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <Clock className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            <span className="font-medium">{pendingUsers.length} user{pendingUsers.length > 1 ? 's' : ''}</span> awaiting approval
            {filterStatus !== 'pending' && (
              <Button variant="link" size="sm" className="ml-2 h-auto p-0 text-amber-700" onClick={() => setFilterStatus('pending')}>
                View pending →
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Search and Filter */}
      <div className="flex gap-2 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as typeof filterStatus)}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users ({users.length})</SelectItem>
            <SelectItem value="pending">Pending ({pendingUsers.length})</SelectItem>
            <SelectItem value="active">Active ({activeUsers.length})</SelectItem>
            <SelectItem value="suspended">Suspended ({suspendedUsers.length})</SelectItem>
            <SelectItem value="admins">Admins ({users.filter(u => u.role === 'admin').length})</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Filter badge */}
      {filterStatus !== 'all' && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)} ({filteredUsers.length})
          </Badge>
          <Button variant="ghost" size="sm" onClick={() => setFilterStatus('all')}>
            Clear filter
          </Button>
        </div>
      )}

      {/* Users List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No users found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((user) => {
            const isPending = user.verification_status === 'pending' || !user.is_approved;
            const isCurrentUser = user.id === currentUserId;
            const isUpdating = updatingUserId === user.id;
            const selectedRole = getSelectedRoleForPending(user.id, user.requested_role);

            return (
              <Card key={user.id} className={`p-4 ${isUpdating ? 'opacity-50' : ''}`}>
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarFallback className="text-sm bg-primary/10 text-primary">
                      {(user.first_name?.[0] || '') + (user.last_name?.[0] || user.email?.[0] || '?')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{getUserDisplayName(user)}</span>
                      {isCurrentUser && <Badge variant="outline" className="text-xs">You</Badge>}
                      {isPending && (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200">
                          <Clock className="h-3 w-3 mr-1" />Pending
                        </Badge>
                      )}
                      {user.is_suspended && (
                        <Badge variant="destructive">
                          <Ban className="h-3 w-3 mr-1" />Suspended
                        </Badge>
                      )}
                      {!isPending && !user.is_suspended && (
                        <Badge variant="default" className="bg-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />Verified
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                    {user.title && <p className="text-xs text-muted-foreground">{user.title}</p>}

                    {/* Pending User: Role selector + Approve/Reject buttons */}
                    {isPending && (
                      <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                        {user.requested_role && (
                          <p className="text-xs text-muted-foreground mb-2">
                            Requested: <span className="font-medium">{getRoleLabel(user.requested_role)}</span>
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium">Assign role:</span>
                          <Select
                            value={selectedRole}
                            onValueChange={(v) => setPendingRoleSelections(prev => ({ ...prev, [user.id]: v as UserRole }))}
                            disabled={isUpdating}
                          >
                            <SelectTrigger className="h-8 w-[140px] text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {SYSTEM_ROLES.map((role) => (
                                <SelectItem key={role.value} value={role.value}>
                                  <div className="flex items-center gap-2">
                                    <span className={`h-2 w-2 rounded-full ${
                                      role.color === 'red' ? 'bg-red-500' :
                                      role.color === 'green' ? 'bg-green-500' :
                                      role.color === 'purple' ? 'bg-purple-500' :
                                      'bg-gray-500'
                                    }`} />
                                    {role.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            onClick={() => handleApproveUser(user.id, selectedRole)}
                            disabled={isUpdating}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <UserCheck className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRejectUser(user.id)}
                            disabled={isUpdating}
                          >
                            <UserX className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Verified User: Role dropdown */}
                    {!isPending && !isCurrentUser && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Role:</span>
                        <Select
                          value={user.role || 'standard'}
                          onValueChange={(v) => handleChangeRole(user.id, v as UserRole)}
                          disabled={isUpdating}
                        >
                          <SelectTrigger className="h-7 w-[130px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SYSTEM_ROLES.map((role) => (
                              <SelectItem key={role.value} value={role.value}>
                                <div className="flex items-center gap-2">
                                  <span className={`h-2 w-2 rounded-full ${
                                    role.color === 'red' ? 'bg-red-500' :
                                    role.color === 'green' ? 'bg-green-500' :
                                    role.color === 'purple' ? 'bg-purple-500' :
                                    'bg-gray-500'
                                  }`} />
                                  {role.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Current user's role (read-only) */}
                    {!isPending && isCurrentUser && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Role:</span>
                        <Badge variant="outline">{getRoleLabel(user.role)}</Badge>
                        <span className="text-xs text-muted-foreground italic">(Cannot change your own role)</span>
                      </div>
                    )}
                  </div>

                  {/* Actions Menu (only for non-pending users) */}
                  {!isPending && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleUnlockAccount(user.email)}>
                          <Unlock className="h-4 w-4 mr-2" />
                          Unlock Account
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.email).then(() => toast.success('Email copied'))}>
                          <Mail className="h-4 w-4 mr-2" />
                          Copy Email
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
