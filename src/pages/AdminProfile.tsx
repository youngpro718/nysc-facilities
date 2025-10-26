import { ChevronLeft, Download, Copy, Check, Users, Shield, FileText, Settings as SettingsIcon, Activity, AlertTriangle, QrCode, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { MobileProfileHeader } from "@/components/profile/mobile/MobileProfileHeader";
import { useState, useEffect } from "react";
import { useRolePermissions } from "@/hooks/useRolePermissions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminManagementTab } from "@/components/profile/reorganized/AdminManagementTab";
import { SecurityAuditPanel } from "@/components/security/SecurityAuditPanel";

import { TitleAccessManager } from "@/components/admin/TitleAccessManager";
import { EnhancedUserManagementModal } from "@/components/profile/modals/EnhancedUserManagementModal";
import { AdminQuickActions } from "@/components/settings/AdminQuickActions";
import SecurityPanel from "@/components/admin/security/SecurityPanel";
import AdminSettingsPanel from "@/components/admin/settings/AdminSettingsPanel";
import { useUserStatistics } from "@/hooks/admin/useUserStatistics";

export default function AdminProfile() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAdmin, userRole } = useRolePermissions();
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [enhancedUserManagementOpen, setEnhancedUserManagementOpen] = useState(false);
  const [modalInitialTab, setModalInitialTab] = useState<string>('all');
  const appUrl = window.location.origin;
  
  // Fetch real user statistics
  const { data: stats, isLoading: statsLoading } = useUserStatistics();
  
  // Get active tab from URL or default to 'users'
  const activeTab = searchParams.get('tab') || 'users';
  
  // Handle tab changes by updating URL
  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  // Handle opening modal with specific tab
  const handleOpenModal = (initialTab: string = 'all') => {
    setModalInitialTab(initialTab);
    setEnhancedUserManagementOpen(true);
  };

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
            <TabsTrigger value="users" className="text-xs sm:text-sm">
              <Users className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Users</span>
              <span className="sm:hidden">👥</span>
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
          <TabsContent value="users" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Statistics
                </CardTitle>
                <CardDescription>
                  Click any statistic to view and manage those users
                  {statsLoading && <span className="ml-2 text-xs">(Loading...)</span>}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button
                    variant="outline"
                    className="h-auto flex-col items-start p-4 hover:bg-primary/5"
                    onClick={() => handleOpenModal('all')}
                    disabled={statsLoading}
                  >
                    <div className="flex items-center gap-2 w-full mb-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="text-xs font-medium">All Users</span>
                    </div>
                    <span className="text-3xl font-bold">
                      {statsLoading ? '...' : stats?.totalUsers || 0}
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">Manage all users</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-auto flex-col items-start p-4 hover:bg-primary/5"
                    onClick={() => handleOpenModal('pending')}
                    disabled={statsLoading}
                  >
                    <div className="flex items-center gap-2 w-full mb-2">
                      <Shield className="h-4 w-4 text-yellow-600" />
                      <span className="text-xs font-medium">Pending</span>
                    </div>
                    <span className="text-3xl font-bold">
                      {statsLoading ? '...' : stats?.pendingUsers || 0}
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">Awaiting approval</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-auto flex-col items-start p-4 hover:bg-primary/5"
                    onClick={() => handleOpenModal('suspended')}
                    disabled={statsLoading}
                  >
                    <div className="flex items-center gap-2 w-full mb-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span className="text-xs font-medium">Suspended</span>
                    </div>
                    <span className="text-3xl font-bold">
                      {statsLoading ? '...' : stats?.suspendedUsers || 0}
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">Blocked accounts</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-auto flex-col items-start p-4 hover:bg-primary/5"
                    onClick={() => handleOpenModal('issues')}
                    disabled={statsLoading}
                  >
                    <div className="flex items-center gap-2 w-full mb-2">
                      <Activity className="h-4 w-4 text-orange-600" />
                      <span className="text-xs font-medium">Issues</span>
                    </div>
                    <span className="text-3xl font-bold">
                      {statsLoading ? '...' : stats?.usersWithIssues || 0}
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">Needs attention</span>
                  </Button>
                </div>
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

      {/* Enhanced User Management Modal */}
      <EnhancedUserManagementModal 
        open={enhancedUserManagementOpen} 
        onOpenChange={setEnhancedUserManagementOpen}
        initialTab={modalInitialTab}
      />
    </div>
  );
}
