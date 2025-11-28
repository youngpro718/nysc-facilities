import { ChevronLeft, Download, Copy, Check, Users, Shield, FileText, Settings as SettingsIcon, Activity, AlertTriangle, QrCode, AlertCircle, Search, RefreshCw, MoreVertical, Edit, Mail, KeyRound, UserX, UserCheck, Ban, CheckCircle, Clock, Unlock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { MobileProfileHeader } from "@/components/profile/mobile/MobileProfileHeader";
import { useState, useEffect } from "react";
import { useRolePermissions } from "@/hooks/useRolePermissions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminManagementTab } from "@/components/profile/reorganized/AdminManagementTab";
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
import AdminSettingsPanel from "@/components/admin/settings/AdminSettingsPanel";
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
  role?: UserRole; // Populated from user_roles table join
  department?: { name: string };
}

export default function AdminProfile() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAdmin, userRole } = useRolePermissions();
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'verified' | 'suspended' | 'admins'>('all');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const appUrl = window.location.origin;
  const { resetLoginAttempts } = useRateLimitManager();
  
  // Fetch real user statistics
  const { data: stats, isLoading: statsLoading } = useUserStatistics();
  
  // Get active tab from URL or default to 'users'
  const activeTab = searchParams.get('tab') || 'users';
  
  // Handle tab changes by updating URL
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

      console.log('Loaded users with roles:', usersWithRoles.map(u => ({ 
        name: `${u.first_name} ${u.last_name}`, 
        email: u.email,
        role: u.role 
      })));

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
      // Use RPC function to update role (bypasses RLS policies)
      const { data, error } = await supabase.rpc('admin_update_user_role', {
        target_user_id: userId,
        new_role: newRole
      });
      
      console.log('RPC Response:', { data, error });
      
      if (error) {
        console.error('RPC error:', error);
        throw error;
      }
      
      // Check if the function returned a success: false response
      if (data && typeof data === 'object' && 'success' in data && !data.success) {
        console.error('Function returned error:', data);
        throw new Error(data.message || 'Role update failed');
      }
      
      // Wait a moment for the database to fully commit the change
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Clear users state to force a fresh fetch
      setUsers([]);
      
      toast.success(`✅ ${userName} is now a ${roleLabel}!`, { id: 'change-role' });
      
      // Reload users with fresh data
      await loadUsers(true);
      
      console.log('Role updated successfully for user:', userId, 'to role:', newRole);
    } catch (error: any) {
      console.error('Error changing role:', error);
      const errorMessage = error?.message || 'Unknown error';
      toast.error(`❌ Failed to change role for ${userName}: ${errorMessage}`, { id: 'change-role' });
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

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const downloadQR = () => {
    const svg = document.getElementById('admin-qr-code');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'NYSC-Facilities-App-QR.png';
          a.click();
          URL.revokeObjectURL(url);
          toast.success('QR code downloaded!');
        }
      });
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

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
          <h1 className="text-xl sm:text-2xl font-semibold truncate">Admin Profile</h1>
        </div>
        <Button
          onClick={() => setShowQR(!showQR)}
          variant="outline"
          size="sm"
          className="gap-2 flex-shrink-0"
        >
          <QrCode className="h-4 w-4" />
          <span className="hidden sm:inline">Install App</span>
        </Button>
      </div>

      {/* Install App QR Code Card */}
      {showQR && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <QrCode className="h-5 w-5" />
              Install App on Phones
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Share this QR code or link with staff to install the app
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              {/* QR Code */}
              <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm">
                <QRCodeSVG
                  id="admin-qr-code"
                  value={appUrl}
                  size={180}
                  level="H"
                  includeMargin={true}
                />
              </div>

              {/* Actions */}
              <div className="flex-1 space-y-2 w-full">
                <div>
                  <p className="text-xs sm:text-sm font-medium mb-2">App Link:</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={appUrl}
                      readOnly
                      className="flex-1 px-2 sm:px-3 py-2 text-xs sm:text-sm border rounded-md bg-background"
                    />
                    <Button onClick={copyToClipboard} variant="outline" size="sm" className="flex-shrink-0">
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <Button onClick={downloadQR} variant="default" size="sm" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download QR Code
                </Button>

                <div className="text-xs text-muted-foreground space-y-1 pt-2">
                  <p><strong>iPhone:</strong> Safari → Share → Add to Home Screen</p>
                  <p><strong>Android:</strong> Chrome → Menu → Add to Home screen</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Header */}
      <MobileProfileHeader />

      {/* Admin Quick Actions */}
      {isAdmin && <AdminQuickActions />}

      {/* Main Content */}
      {isAdmin ? (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="w-full grid grid-cols-5">
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
            <TabsTrigger value="settings" className="text-xs sm:text-sm">
              <SettingsIcon className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Settings</span>
              <span className="sm:hidden">⚙️</span>
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
                      Manage all users and their roles in one place. Click statistics to filter, search users, and change roles instantly.
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
                className={`cursor-pointer transition-all hover:shadow-md ${
                  filterStatus === 'all' 
                    ? 'ring-2 ring-primary bg-primary/5' 
                    : 'hover:bg-accent'
                }`}
                onClick={() => {
                  setFilterStatus('all');
                  toast.info('Showing all users');
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <span className="text-2xl font-bold">{users.length}</span>
                  </div>
                  <p className="text-sm font-medium">All Users</p>
                  <p className="text-xs text-muted-foreground mt-1">Click to view</p>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-colors ${filterStatus === 'pending' ? 'ring-2 ring-primary' : 'hover:bg-accent'}`}
                onClick={() => setFilterStatus('pending')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Clock className="h-5 w-5 text-yellow-600" />
                    <span className="text-2xl font-bold">{users.filter(u => u.verification_status === 'pending' || !u.is_approved).length}</span>
                  </div>
                  <p className="text-sm font-medium">Pending</p>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-colors ${filterStatus === 'verified' ? 'ring-2 ring-primary' : 'hover:bg-accent'}`}
                onClick={() => setFilterStatus('verified')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-2xl font-bold">{users.filter(u => u.verification_status === 'verified' && u.is_approved && !u.is_suspended).length}</span>
                  </div>
                  <p className="text-sm font-medium">Verified</p>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-colors ${filterStatus === 'suspended' ? 'ring-2 ring-primary' : 'hover:bg-accent'}`}
                onClick={() => setFilterStatus('suspended')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Ban className="h-5 w-5 text-red-600" />
                    <span className="text-2xl font-bold">{users.filter(u => u.is_suspended).length}</span>
                  </div>
                  <p className="text-sm font-medium">Suspended</p>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-colors ${filterStatus === 'admins' ? 'ring-2 ring-primary' : 'hover:bg-accent'}`}
                onClick={() => setFilterStatus('admins')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Shield className="h-5 w-5 text-purple-600" />
                    <span className="text-2xl font-bold">{users.filter(u => u.role === 'admin').length}</span>
                  </div>
                  <p className="text-sm font-medium">Admins</p>
                </CardContent>
              </Card>
            </div>

            {/* Pending Users Alert */}
            {users.filter(u => u.verification_status === 'pending' || !u.is_approved).length > 0 && filterStatus !== 'pending' && (
              <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-amber-800 dark:text-amber-200">
                          {users.filter(u => u.verification_status === 'pending' || !u.is_approved).length} Users Awaiting Approval
                        </p>
                        <p className="text-sm text-amber-600 dark:text-amber-400">
                          New users are waiting for your approval to access the system
                        </p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => setFilterStatus('pending')}
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      Review Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Search Bar */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleManualRefresh}
                    variant="outline"
                    size="sm"
                    disabled={refreshing}
                  >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Users List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>
                    {filterStatus === 'all' && 'All Users'}
                    {filterStatus === 'pending' && 'Pending Approvals'}
                    {filterStatus === 'verified' && 'Verified Users'}
                    {filterStatus === 'suspended' && 'Suspended Users'}
                    {filterStatus === 'admins' && 'Administrators'}
                  </span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No users found
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredUsers.map((user) => (
                      <Card 
                        key={user.id} 
                        className={`p-4 transition-all ${
                          updatingUserId === user.id 
                            ? 'ring-2 ring-primary animate-pulse' 
                            : ''
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                              {user.first_name?.[0] || user.email[0].toUpperCase()}
                              {user.last_name?.[0] || ''}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-base truncate">
                                  {user.first_name && user.last_name 
                                    ? `${user.first_name} ${user.last_name}`
                                    : user.email
                                  }
                                  {user.id === currentUserId && (
                                    <Badge variant="outline" className="ml-2 text-xs">You</Badge>
                                  )}
                                </h3>
                                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                                {user.title && (
                                  <p className="text-sm text-muted-foreground">{user.title}</p>
                                )}
                              </div>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                  {(user.verification_status === 'pending' || !user.is_approved) && (
                                    <>
                                      <DropdownMenuItem onClick={() => handleApproveUser(user.id)}>
                                        <UserCheck className="h-4 w-4 mr-2" />
                                        Approve User
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        onClick={() => handleRejectUser(user.id)}
                                        className="text-red-600"
                                      >
                                        <UserX className="h-4 w-4 mr-2" />
                                        Reject User
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                    </>
                                  )}
                                  <DropdownMenuItem onClick={() => handleUnlockAccount(user.email)}>
                                    <Unlock className="h-4 w-4 mr-2" />
                                    Unlock Account
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => {
                                    navigator.clipboard.writeText(user.email);
                                    toast.success('Email copied to clipboard');
                                  }}>
                                    <Mail className="h-4 w-4 mr-2" />
                                    Copy Email
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            <div className="space-y-2 mt-3">
                              <div className="flex flex-wrap gap-2">
                                {user.is_suspended ? (
                                  <Badge variant="destructive" className="gap-1"><Ban className="h-3 w-3" />Suspended</Badge>
                                ) : user.verification_status === 'pending' || !user.is_approved ? (
                                  <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Pending</Badge>
                                ) : (
                                  <Badge variant="default" className="gap-1 bg-green-600"><CheckCircle className="h-3 w-3" />Verified</Badge>
                                )}
                              </div>
                              
                              {user.verification_status === 'verified' && user.is_approved && !user.is_suspended && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-muted-foreground">Role:</span>
                                  <Select
                                    key={`${user.id}-${user.role}`}
                                    value={user.role || 'standard'}
                                    onValueChange={(value) => handleChangeRole(user.id, value as UserRole)}
                                    disabled={user.id === currentUserId || updatingUserId === user.id}
                                  >
                                    <SelectTrigger className="w-[220px] h-8 text-sm font-medium border-2 hover:border-primary transition-colors">
                                      <SelectValue>
                                        {updatingUserId === user.id ? 'Updating...' : getRoleLabel(user.role || 'standard')}
                                      </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                      {SYSTEM_ROLES.map((role) => (
                                        <SelectItem key={role.value} value={role.value} className="font-medium">
                                          <div className="flex items-center gap-2">
                                            <div className={`h-2 w-2 rounded-full ${
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
                          </div>
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

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-4">
            <AdminSettingsPanel />
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
