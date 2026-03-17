import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  Ban,
  CheckCircle,
  ChevronLeft,
  Clock,
  Mail,
  MoreVertical,
  RefreshCw,
  Search,
  Settings,
  Shield,
  Trash2,
  Unlock,
  UserCheck,
  UserX,
  Users,
  AlertTriangle,
  KeyRound,
  Wrench,
} from 'lucide-react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errorUtils';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import { requestPasswordReset } from '@/services/auth';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { useRateLimitManager } from '@/hooks/security/useRateLimitManager';
import { useConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DatabaseSection } from '@/components/profile/DatabaseSection';
import { ModuleManagement } from '@/components/profile/ModuleManagement';
import { RateLimitManager } from '@/components/admin/RateLimitManager';
import { SYSTEM_ROLES, getRoleLabel, type UserRole } from '@/config/roles';

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

interface SuspendDialogState {
  open: boolean;
  user: UserProfile | null;
  reason: string;
}

interface DeleteDialogState {
  open: boolean;
  user: UserProfile | null;
  confirmation: string;
}

function SystemSettingsContent() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-semibold">Install App on Phones</h3>
              <p className="text-sm text-muted-foreground">Share QR code or install instructions with staff.</p>
            </div>
            <Button onClick={() => navigate('/install')} size="sm">View QR Code</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Module Management</CardTitle>
          <CardDescription>Enable or disable major product areas from one place.</CardDescription>
        </CardHeader>
        <CardContent>
          <ModuleManagement />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Database Management</CardTitle>
          <CardDescription>Exports, backups, and operational database tools.</CardDescription>
        </CardHeader>
        <CardContent>
          <DatabaseSection />
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminCenter() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAdmin, userRole } = useRolePermissions();
  const { resetLoginAttempts } = useRateLimitManager();
  const [confirmAction, confirmDialog] = useConfirmDialog();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'active' | 'suspended' | 'admins'>('all');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [pendingRoleSelections, setPendingRoleSelections] = useState<Record<string, UserRole>>({});
  const [suspendDialog, setSuspendDialog] = useState<SuspendDialogState>({ open: false, user: null, reason: '' });
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({ open: false, user: null, confirmation: '' });

  const activeTab = searchParams.get('tab') || 'overview';
  const handleTabChange = (value: string) => setSearchParams({ tab: value });

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

      const [profilesResult, rolesResult] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('user_roles').select('user_id, role'),
      ]);

      if (profilesResult.error) throw profilesResult.error;
      if (rolesResult.error) throw rolesResult.error;

      const roleMap = new Map(rolesResult.data?.map((role) => [role.user_id, role.role]) || []);
      const usersWithRoles = (profilesResult.data || []).map((profile) => ({
        ...profile,
        role: (roleMap.get(profile.id) as UserRole) || 'standard',
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      logger.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleManualRefresh = async () => {
    await loadUsers(true);
    toast.success('User data refreshed.');
  };

  const getUserDisplayName = (user: UserProfile) => {
    if (user.first_name || user.last_name) return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    return user.email?.split('@')[0] || 'Unknown';
  };

  const getSelectedRoleForPending = (userId: string, requestedRole?: string | null): UserRole => {
    if (pendingRoleSelections[userId]) return pendingRoleSelections[userId];
    if (requestedRole && SYSTEM_ROLES.some((role) => role.value === requestedRole)) return requestedRole as UserRole;
    return 'standard';
  };

  const pendingUsers = useMemo(() => users.filter((user) => user.verification_status === 'pending' || !user.is_approved), [users]);
  const activeUsers = useMemo(() => users.filter((user) => user.verification_status === 'verified' && user.is_approved && !user.is_suspended), [users]);
  const suspendedUsers = useMemo(() => users.filter((user) => user.is_suspended), [users]);
  const adminUsers = useMemo(() => users.filter((user) => user.role === 'admin'), [users]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || user.email?.toLowerCase().includes(searchLower) || user.first_name?.toLowerCase().includes(searchLower) || user.last_name?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;

      switch (filterStatus) {
        case 'pending':
          return user.verification_status === 'pending' || !user.is_approved;
        case 'active':
          return user.verification_status === 'verified' && user.is_approved && !user.is_suspended;
        case 'suspended':
          return user.is_suspended;
        case 'admins':
          return user.role === 'admin';
        default:
          return true;
      }
    });
  }, [users, searchTerm, filterStatus]);

  const currentAdmin = users.find((user) => user.id === currentUserId);
  const currentAdminName = currentAdmin ? getUserDisplayName(currentAdmin) : 'Admin';

  const stats = [
    { label: 'Pending approvals', value: pendingUsers.length, icon: Clock },
    { label: 'Active users', value: activeUsers.length, icon: Users },
    { label: 'Suspended', value: suspendedUsers.length, icon: Ban },
    { label: 'Admins', value: adminUsers.length, icon: Shield },
  ];

  const runUserMutation = async (userId: string, action: () => Promise<void>) => {
    setUpdatingUserId(userId);
    try {
      await action();
      await loadUsers(true);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleApproveUser = async (userId: string, selectedRole: UserRole) => {
    const user = users.find((entry) => entry.id === userId);
    await runUserMutation(userId, async () => {
      toast.loading('Approving user...', { id: 'approve-user' });
      const { error } = await supabase.rpc('approve_user_verification', {
        p_user_id: userId,
        p_role: selectedRole,
        p_admin_notes: `Approved via admin center with role: ${getRoleLabel(selectedRole)}`,
      });
      if (error) throw error;
      toast.success(`${getUserDisplayName(user!)} approved as ${getRoleLabel(selectedRole)}.`, { id: 'approve-user' });
      setPendingRoleSelections((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    }).catch((error) => {
      logger.error('Error approving user:', error);
      toast.error(getErrorMessage(error) || 'Failed to approve user.', { id: 'approve-user' });
    });
  };

  const handleRejectUser = async (userId: string) => {
    const user = users.find((entry) => entry.id === userId);
    await runUserMutation(userId, async () => {
      toast.loading('Rejecting user...', { id: 'reject-user' });
      const { error } = await supabase.rpc('reject_user_verification', {
        p_user_id: userId,
        p_admin_notes: 'Rejected via admin center',
      });
      if (error) throw error;
      toast.success(`${getUserDisplayName(user!)} has been rejected.`, { id: 'reject-user' });
    }).catch((error) => {
      logger.error('Error rejecting user:', error);
      toast.error(getErrorMessage(error) || 'Failed to reject user.', { id: 'reject-user' });
    });
  };

  const handleChangeRole = async (userId: string, newRole: UserRole) => {
    const user = users.find((entry) => entry.id === userId);
    await runUserMutation(userId, async () => {
      toast.loading('Updating role...', { id: 'change-role' });
      const { data, error } = await supabase.rpc('admin_update_user_role', {
        target_user_id: userId,
        new_role: newRole,
      });
      if (error) throw error;
      if (data && typeof data === 'object' && 'success' in data && !data.success) throw new Error(String(data.message || 'Role update failed'));
      toast.success(`${getUserDisplayName(user!)} is now ${getRoleLabel(newRole)}.`, { id: 'change-role' });
    }).catch((error) => {
      logger.error('Error changing role:', error);
      toast.error(getErrorMessage(error) || 'Failed to update role.', { id: 'change-role' });
    });
  };

  const handleUnlockAccount = async (user: UserProfile) => {
    toast.loading('Unlocking account...', { id: 'unlock-account' });
    try {
      const success = await resetLoginAttempts(user.email);
      if (!success) throw new Error('Reset did not complete');
      toast.success(`Login lock cleared for ${user.email}.`, { id: 'unlock-account' });
    } catch (error) {
      logger.error('Error unlocking account:', error);
      toast.error(getErrorMessage(error) || 'Failed to unlock account.', { id: 'unlock-account' });
    }
  };

  const handleSendResetEmail = async (user: UserProfile) => {
    toast.loading('Sending reset email...', { id: 'reset-email' });
    try {
      await requestPasswordReset(user.email);
      toast.success(`Password reset email sent to ${user.email}.`, { id: 'reset-email' });
    } catch (error) {
      logger.error('Error sending password reset email:', error);
      toast.error(getErrorMessage(error) || 'Failed to send reset email.', { id: 'reset-email' });
    }
  };

  const handleSuspendUser = async () => {
    if (!suspendDialog.user || !suspendDialog.reason.trim()) {
      toast.error('Add a suspension reason first.');
      return;
    }

    const user = suspendDialog.user;
    await runUserMutation(user.id, async () => {
      toast.loading('Suspending user...', { id: 'suspend-user' });
      const { error } = await supabase.rpc('admin_suspend_user', {
        target_user_id: user.id,
        p_reason: suspendDialog.reason.trim(),
      });
      if (error) throw error;
      toast.success(`${getUserDisplayName(user)} has been deactivated.`, { id: 'suspend-user' });
      setSuspendDialog({ open: false, user: null, reason: '' });
    }).catch((error) => {
      logger.error('Error suspending user:', error);
      toast.error(getErrorMessage(error) || 'Failed to deactivate user.', { id: 'suspend-user' });
    });
  };

  const handleUnsuspendUser = async (user: UserProfile) => {
    await runUserMutation(user.id, async () => {
      toast.loading('Reactivating user...', { id: 'unsuspend-user' });
      const { error } = await supabase.rpc('admin_unsuspend_user', { target_user_id: user.id });
      if (error) throw error;
      toast.success(`${getUserDisplayName(user)} has been reactivated.`, { id: 'unsuspend-user' });
    }).catch((error) => {
      logger.error('Error reactivating user:', error);
      toast.error(getErrorMessage(error) || 'Failed to reactivate user.', { id: 'unsuspend-user' });
    });
  };

  const handleDeleteUser = async () => {
    if (!deleteDialog.user) return;
    if (deleteDialog.confirmation.trim().toLowerCase() !== deleteDialog.user.email.toLowerCase()) {
      toast.error('Type the full email address to confirm deletion.');
      return;
    }

    const user = deleteDialog.user;
    await runUserMutation(user.id, async () => {
      toast.loading('Deleting user...', { id: 'delete-user' });
      const { error } = await supabase.rpc('admin_delete_user', { p_user_id: user.id });
      if (error) throw error;
      toast.success(`${getUserDisplayName(user)} has been permanently deleted.`, { id: 'delete-user' });
      setDeleteDialog({ open: false, user: null, confirmation: '' });
    }).catch((error) => {
      logger.error('Error deleting user:', error);
      toast.error(getErrorMessage(error) || 'Failed to delete user.', { id: 'delete-user' });
    });
  };

  if (!isAdmin) {
    return (
      <div className="space-y-4 pb-20 px-3 sm:px-0">
        <div className="flex items-center gap-2 pt-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-9 w-9">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold">Admin Center</h1>
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
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Admin Center</h1>
          <p className="text-sm text-muted-foreground">
            Logged in as <span className="font-medium text-foreground">{currentAdminName}</span>
            <Badge variant="outline" className="ml-2">{getRoleLabel(userRole)}</Badge>
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleManualRefresh} disabled={refreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="flex h-auto flex-wrap justify-start gap-2 bg-transparent p-0">
          <TabsTrigger value="overview" className="gap-1.5">
            <Users className="h-4 w-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="accounts" className="gap-1.5">
            <UserCheck className="h-4 w-4" /> User Accounts
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-1.5">
            <Shield className="h-4 w-4" /> Security & Access
          </TabsTrigger>
          <TabsTrigger value="system" className="gap-1.5">
            <Settings className="h-4 w-4" /> System Tools
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label}>
                  <CardContent className="flex items-center justify-between p-5">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-3xl font-semibold text-foreground">{stat.value}</p>
                    </div>
                    <div className="rounded-full bg-primary/10 p-3 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {pendingUsers.length > 0 && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                <span className="font-medium">{pendingUsers.length} account{pendingUsers.length === 1 ? '' : 's'}</span> need approval.
                <Button variant="link" size="sm" className="ml-2 h-auto p-0" onClick={() => {
                  setFilterStatus('pending');
                  handleTabChange('accounts');
                }}>
                  Review now
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Quick actions</CardTitle>
                <CardDescription>Shortcuts to the most common admin tasks.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <Button variant="outline" className="justify-start" onClick={() => {
                  setFilterStatus('pending');
                  handleTabChange('accounts');
                }}>
                  <UserCheck className="mr-2 h-4 w-4" /> Approve pending users
                </Button>
                <Button variant="outline" className="justify-start" onClick={() => handleTabChange('security')}>
                  <Unlock className="mr-2 h-4 w-4" /> Unlock accounts
                </Button>
                <Button variant="outline" className="justify-start" onClick={() => {
                  setFilterStatus('suspended');
                  handleTabChange('accounts');
                }}>
                  <Ban className="mr-2 h-4 w-4" /> Reactivate suspended users
                </Button>
                <Button variant="outline" className="justify-start" onClick={() => handleTabChange('system')}>
                  <Wrench className="mr-2 h-4 w-4" /> Open system tools
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Needs attention</CardTitle>
                <CardDescription>What should be handled first.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <span>Pending approvals</span>
                  <Badge variant="secondary">{pendingUsers.length}</Badge>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <span>Suspended accounts</span>
                  <Badge variant="secondary">{suspendedUsers.length}</Badge>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <span>Admin accounts</span>
                  <Badge variant="secondary">{adminUsers.length}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="accounts" className="mt-4 space-y-4">
          <div className="flex gap-2 flex-col sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search by name or email..." className="pl-9" />
            </div>
            <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as typeof filterStatus)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All users ({users.length})</SelectItem>
                <SelectItem value="pending">Pending ({pendingUsers.length})</SelectItem>
                <SelectItem value="active">Active ({activeUsers.length})</SelectItem>
                <SelectItem value="suspended">Suspended ({suspendedUsers.length})</SelectItem>
                <SelectItem value="admins">Admins ({adminUsers.length})</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filterStatus !== 'all' && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{filterStatus} ({filteredUsers.length})</Badge>
              <Button variant="ghost" size="sm" onClick={() => setFilterStatus('all')}>Clear filter</Button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertCircle className="mx-auto mb-2 h-8 w-8 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No users found.</p>
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
                  <Card key={user.id} className={isUpdating ? 'opacity-60' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {(user.first_name?.[0] || '') + (user.last_name?.[0] || user.email?.[0] || '?')}
                          </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0 flex-1 space-y-3">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium text-foreground">{getUserDisplayName(user)}</span>
                              {isCurrentUser && <Badge variant="outline">You</Badge>}
                              {isPending ? (
                                <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Pending</Badge>
                              ) : user.is_suspended ? (
                                <Badge variant="destructive"><Ban className="mr-1 h-3 w-3" />Suspended</Badge>
                              ) : (
                                <Badge variant="default"><CheckCircle className="mr-1 h-3 w-3" />Verified</Badge>
                              )}
                              {!isPending && <Badge variant="outline">{getRoleLabel(user.role || 'standard')}</Badge>}
                            </div>
                            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                            {user.title ? <p className="text-xs text-muted-foreground">{user.title}</p> : null}
                            {user.suspension_reason ? <p className="text-xs text-muted-foreground">Suspension reason: {user.suspension_reason}</p> : null}
                          </div>

                          {isPending ? (
                            <div className="rounded-lg border border-border bg-muted/30 p-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-medium">Assign role:</span>
                                <Select value={selectedRole} onValueChange={(value) => setPendingRoleSelections((prev) => ({ ...prev, [user.id]: value as UserRole }))} disabled={isUpdating}>
                                  <SelectTrigger className="h-8 w-[180px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {SYSTEM_ROLES.map((role) => (
                                      <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button size="sm" onClick={() => handleApproveUser(user.id, selectedRole)} disabled={isUpdating}>
                                  <UserCheck className="mr-1 h-4 w-4" /> Approve
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleRejectUser(user.id)} disabled={isUpdating}>
                                  <UserX className="mr-1 h-4 w-4" /> Reject
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs text-muted-foreground">Role</span>
                              {isCurrentUser ? (
                                <Badge variant="outline">{getRoleLabel(user.role || 'standard')}</Badge>
                              ) : (
                                <Select value={user.role || 'standard'} onValueChange={(value) => handleChangeRole(user.id, value as UserRole)} disabled={isUpdating}>
                                  <SelectTrigger className="h-8 w-[180px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {SYSTEM_ROLES.map((role) => (
                                      <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            </div>
                          )}
                        </div>

                        {!isPending && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-60">
                              <DropdownMenuItem onClick={() => handleSendResetEmail(user)}>
                                <KeyRound className="mr-2 h-4 w-4" /> Send reset email
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUnlockAccount(user)}>
                                <Unlock className="mr-2 h-4 w-4" /> Unlock account
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.email).then(() => toast.success('Email copied.'))}>
                                <Mail className="mr-2 h-4 w-4" /> Copy email
                              </DropdownMenuItem>
                              {!isCurrentUser && (
                                <>
                                  <DropdownMenuSeparator />
                                  {user.is_suspended ? (
                                    <DropdownMenuItem onClick={() => handleUnsuspendUser(user)}>
                                      <CheckCircle className="mr-2 h-4 w-4" /> Reactivate account
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem onClick={() => setSuspendDialog({ open: true, user, reason: user.suspension_reason || '' })}>
                                      <Ban className="mr-2 h-4 w-4" /> Deactivate account
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteDialog({ open: true, user, confirmation: '' })}>
                                    <Trash2 className="mr-2 h-4 w-4" /> Permanent delete
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="security" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
            <Card>
              <CardHeader>
                <CardTitle>Security & access actions</CardTitle>
                <CardDescription>Reduce lockouts and help users regain access faster.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg border border-border p-4">
                  <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
                    <Unlock className="h-4 w-4 text-primary" /> Login lock recovery
                  </div>
                  <p className="text-sm text-muted-foreground">Reset rate limits or inspect blocked access without leaving the admin area.</p>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
                    <KeyRound className="h-4 w-4 text-primary" /> Password reset delivery
                  </div>
                  <p className="text-sm text-muted-foreground">Admins can send reset emails from the User Accounts tab, and users can now complete the full reset flow themselves.</p>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
                    <AlertTriangle className="h-4 w-4 text-primary" /> Deactivate before delete
                  </div>
                  <p className="text-sm text-muted-foreground">Use deactivation for safer access removal, then reserve permanent delete for irreversible cleanup.</p>
                </div>
              </CardContent>
            </Card>
            <RateLimitManager />
          </div>
        </TabsContent>

        <TabsContent value="system" className="mt-4">
          <SystemSettingsContent />
        </TabsContent>
      </Tabs>

      <Dialog open={suspendDialog.open} onOpenChange={(open) => setSuspendDialog((prev) => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate account</DialogTitle>
            <DialogDescription>Temporarily block sign-in while keeping profile history and audit records intact.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
              {suspendDialog.user ? `${getUserDisplayName(suspendDialog.user)} (${suspendDialog.user.email})` : 'No user selected'}
            </div>
            <div className="space-y-2">
              <Label htmlFor="suspension-reason">Reason</Label>
              <Input id="suspension-reason" value={suspendDialog.reason} onChange={(event) => setSuspendDialog((prev) => ({ ...prev, reason: event.target.value }))} placeholder="Explain why access is being removed" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendDialog({ open: false, user: null, reason: '' })}>Cancel</Button>
            <Button variant="destructive" onClick={handleSuspendUser}>Deactivate account</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog((prev) => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Permanently delete user</DialogTitle>
            <DialogDescription>This removes the user from the system entirely. Type the email address below to confirm.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>This action cannot be undone and should only be used when deactivation is not enough.</AlertDescription>
            </Alert>
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
              {deleteDialog.user ? `${getUserDisplayName(deleteDialog.user)} — ${deleteDialog.user.email}` : 'No user selected'}
            </div>
            <div className="space-y-2">
              <Label htmlFor="delete-confirmation">Type email to confirm</Label>
              <Input id="delete-confirmation" value={deleteDialog.confirmation} onChange={(event) => setDeleteDialog((prev) => ({ ...prev, confirmation: event.target.value }))} placeholder={deleteDialog.user?.email || 'user@example.com'} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, user: null, confirmation: '' })}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteUser}>Permanent delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {confirmAction && confirmDialog}
    </div>
  );
}
