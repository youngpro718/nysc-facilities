import { Download, Copy, Check, Users, Shield, Settings as SettingsIcon, Activity, QrCode, Search, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { MobileProfileHeader } from "@/components/profile/mobile/MobileProfileHeader";
import { useState, useMemo } from "react";
import { useRolePermissions } from "@/hooks/useRolePermissions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminManagementTab } from "@/components/profile/reorganized/AdminManagementTab";
import { SecurityAuditPanel } from "@/components/security/SecurityAuditPanel";

import { TitleAccessManager } from "@/components/admin/TitleAccessManager";
import { type UserRole } from "@/config/roles";
import { UserStatsCards, PendingUsersAlert, UserListCard } from "@/components/admin/users";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { AdminQuickActions } from "@/components/settings/AdminQuickActions";
import SecurityPanel from "@/components/admin/security/SecurityPanel";
import AdminSettingsPanel from "@/components/admin/settings/AdminSettingsPanel";
import { useUserStatistics } from "@/hooks/admin/useUserStatistics";
import { useUserManagement, type FilterStatus } from "@/hooks/admin/useUserManagement";

export default function AdminProfile() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAdmin, userRole } = useRolePermissions();
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const appUrl = window.location.origin;
  
  // User management hook - handles all user data and mutations
  const {
    users,
    userStats,
    currentUserId,
    isLoading: loading,
    isRefreshing: refreshing,
    filterUsers,
    refreshUsers,
    approveUser,
    rejectUser,
    changeRole,
    unlockAccount,
    updatingUserId,
  } = useUserManagement();
  
  // Fetch real user statistics for dashboard
  const { data: stats, isLoading: statsLoading } = useUserStatistics();
  
  // Get active tab from URL or default to 'users'
  const activeTab = searchParams.get('tab') || 'users';
  
  // Handle tab changes by updating URL
  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  // Filter users based on search and status
  const filteredUsers = useMemo(() => 
    filterUsers(searchTerm, filterStatus), 
    [filterUsers, searchTerm, filterStatus]
  );

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
      <Breadcrumb />
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-semibold truncate">Admin Profile</h1>
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
            <UserStatsCards
              totalUsers={userStats.total}
              pendingCount={userStats.pending}
              verifiedCount={userStats.verified}
              suspendedCount={userStats.suspended}
              adminCount={userStats.admins}
              activeFilter={filterStatus}
              onFilterChange={setFilterStatus}
            />

            {/* Pending Users Alert */}
            <PendingUsersAlert
              pendingCount={userStats.pending}
              onReviewClick={() => setFilterStatus('pending')}
              isVisible={filterStatus !== 'pending'}
            />

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
                    onClick={refreshUsers}
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
                      <UserListCard
                        key={user.id}
                        user={user}
                        currentUserId={currentUserId}
                        updatingUserId={updatingUserId}
                        onApprove={approveUser}
                        onReject={rejectUser}
                        onUnlock={unlockAccount}
                        onChangeRole={changeRole}
                        onCopyEmail={(email) => {
                          navigator.clipboard.writeText(email);
                          toast.success('Email copied to clipboard');
                        }}
                      />
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
