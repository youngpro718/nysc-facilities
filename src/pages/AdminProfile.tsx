import { ChevronLeft, Settings, Shield } from "lucide-react";
import { RateLimitManager } from "@/components/admin/RateLimitManager";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DynamicAdminDashboard } from "@/components/profile/admin/DynamicAdminDashboard";
import { MobileProfileHeader } from "@/components/profile/mobile/MobileProfileHeader";
import { RoleManagement } from "@/components/profile/RoleManagement";
import { useState, useEffect } from "react";
import { useRolePermissions, CourtRole } from "@/hooks/useRolePermissions";
import { Badge } from "@/components/ui/badge";

// Admin sections kept inline
import { AdminManagementTab } from "@/components/profile/reorganized/AdminManagementTab";

// Admin-only role preview control used within AdminProfile header
function PreviewRoleControl() {
  const { userRole, refetch } = useRolePermissions();
  const [preview, setPreview] = useState<string | null>(
    typeof window !== 'undefined' ? localStorage.getItem('preview_role') : null
  );

  if (userRole !== 'admin') return null;

  const roles: CourtRole[] = [
    'admin',
    'standard',
    'judge',
    'court_aide',
    'clerk',
    'sergeant',
    'court_officer',
    'bailiff',
    'court_reporter',
    'administrative_assistant',
    'facilities_manager',
    'supply_room_staff',
  ];

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as CourtRole | '';
    if (!value || value === 'admin') {
      localStorage.removeItem('preview_role');
      setPreview(null);
    } else {
      localStorage.setItem('preview_role', value);
      setPreview(value);
    }
    refetch?.();
  };

  const clear = () => {
    localStorage.removeItem('preview_role');
    setPreview(null);
    refetch?.();
  };

  return (
    <div className="ml-auto flex items-center gap-2">
      {preview && (
        <Badge variant="secondary" className="hidden sm:inline-flex">Preview: {preview}</Badge>
      )}
      <select
        aria-label="Preview as role"
        className="border rounded-md px-2 py-1 text-sm bg-background"
        onChange={onChange}
        value={preview ?? 'admin'}
      >
        {roles.map(r => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>
      {preview && (
        <Button size="sm" variant="outline" onClick={clear} title="Clear preview role">
          Clear
        </Button>
      )}
    </div>
  );
}

export default function AdminProfile() {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
        <DynamicAdminDashboard />
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
        {/* Admin-only UI role preview control */}
        <PreviewRoleControl />
      </div>

      <MobileProfileHeader />

      <div className="space-y-6">
        <Card>
          <CardHeader className="flex items-center justify-between space-y-0">
            <div>
              <CardTitle>Admin Overview</CardTitle>
              <CardDescription>Your personal admin dashboard and quick actions</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/system-settings')}
              className="gap-2"
            >
              <Settings className="h-4 w-4" />
              System Settings
            </Button>
          </CardHeader>
          <CardContent>
            <DynamicAdminDashboard />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Access the most common admin tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={() => navigate('/settings')}>Open Settings</Button>
              <Button variant="secondary" onClick={() => navigate('/settings?tab=security')} className="gap-2">
                <Shield className="h-4 w-4" /> Security Settings
              </Button>
              <Button variant="secondary" onClick={() => navigate('/system-settings')} className="gap-2">
                <Settings className="h-4 w-4" /> System Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Manage users, roles, permissions, and access</CardDescription>
          </CardHeader>
          <CardContent>
            <AdminManagementTab />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security Management</CardTitle>
            <CardDescription>Rate limits and access controls</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <RateLimitManager />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
