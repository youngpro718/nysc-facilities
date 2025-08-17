import { ChevronLeft } from "lucide-react";
import { RateLimitManager } from "@/components/admin/RateLimitManager";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

  // Remove the broken navigation settings and use modals instead
  // These functions are now handled by the MobileAdminDashboard modals

  // Remove the broken security navigation - handled by modals now

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
