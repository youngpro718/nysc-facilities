import { ChevronLeft, QrCode, Download, Copy, Check } from "lucide-react";
import { RateLimitManager } from "@/components/admin/RateLimitManager";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { DynamicAdminDashboard } from "@/components/profile/admin/DynamicAdminDashboard";
import { MobileProfileHeader } from "@/components/profile/mobile/MobileProfileHeader";
import { useState, useEffect } from "react";
import { useRolePermissions, CourtRole } from "@/hooks/useRolePermissions";
import { Badge } from "@/components/ui/badge";
import { AdminSystemSettings } from "@/components/profile/AdminSystemSettings";
import { DatabaseSection } from "@/components/profile/DatabaseSection";
import { SecurityAuditPanel } from "@/components/security/SecurityAuditPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Admin sections kept inline
import { AdminManagementTab } from "@/components/profile/reorganized/AdminManagementTab";

// Role preview control removed per request

export default function AdminProfile() {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  const { isAdmin, userRole, refetch } = useRolePermissions();
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const appUrl = window.location.origin;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Clear any legacy preview role to avoid masking admin sections
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const hadPreview = localStorage.getItem('preview_role');
        if (hadPreview) {
          localStorage.removeItem('preview_role');
          refetch?.();
        }
      }
    } catch {
      // no-op
    }
  }, [refetch]);

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

  if (isMobile) {
    return (
      <div className="space-y-4 pb-nav-safe">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="h-9 w-9"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-semibold">Admin Profile</h1>
        </div>

        <MobileProfileHeader />
        {isAdmin ? (
          <div className="space-y-6">
            <DynamicAdminDashboard />

            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage users, roles, permissions, and access</CardDescription>
              </CardHeader>
              <CardContent>
                <AdminManagementTab />
              </CardContent>
            </Card>

            <SecurityAuditPanel />

            <RateLimitManager />

            <AdminSystemSettings />

            <DatabaseSection />
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Admin Sections Hidden</CardTitle>
              <CardDescription>
                You are previewing as "{userRole}". Admin-only sections are hidden on this page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              Use the role selector to switch back to Admin.
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-nav-safe">
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="h-9 w-9 sm:h-10 sm:w-10"
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <h1 className="text-2xl sm:text-3xl font-semibold">Admin Profile</h1>
        </div>
        <Button
          onClick={() => setShowQR(!showQR)}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <QrCode className="h-4 w-4" />
          <span className="hidden sm:inline">Install App</span>
        </Button>
      </div>

      {/* Install App QR Code Card */}
      {showQR && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Install App on Phones
            </CardTitle>
            <CardDescription>
              Share this QR code or link with staff to install the app on their phones
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              {/* QR Code */}
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <QRCodeSVG
                  id="admin-qr-code"
                  value={appUrl}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>

              {/* Actions */}
              <div className="flex-1 space-y-3 w-full">
                <div>
                  <p className="text-sm font-medium mb-2">App Link:</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={appUrl}
                      readOnly
                      className="flex-1 px-3 py-2 text-sm border rounded-md bg-background"
                    />
                    <Button onClick={copyToClipboard} variant="outline" size="sm">
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={downloadQR} variant="default" size="sm" className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Download QR Code
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <p><strong>iPhone:</strong> Open in Safari → Share → Add to Home Screen</p>
                  <p><strong>Android:</strong> Open in Chrome → Menu → Add to Home screen</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <MobileProfileHeader />

      <div className="space-y-6">
        {isAdmin ? (
          <Tabs defaultValue="users" className="w-full">
            <TabsList className="w-full grid grid-cols-2 sm:grid-cols-4">
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
              <TabsTrigger value="database">Database</TabsTrigger>
            </TabsList>

            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>Manage users, roles, permissions, and access</CardDescription>
                </CardHeader>
                <CardContent>
                  <AdminManagementTab />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <SecurityAuditPanel />
            </TabsContent>

            <TabsContent value="system">
              <AdminSystemSettings />
            </TabsContent>

            <TabsContent value="database">
              <DatabaseSection />
            </TabsContent>
          </Tabs>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Admin Sections Hidden</CardTitle>
              <CardDescription>
                You are previewing as "{userRole}". Admin-only sections are hidden on this page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              Use the role selector above to switch back to Admin.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
