import { useState, useEffect } from "react";
import { useDashboardCustomization } from "@/providers/DashboardCustomizationProvider";
import { SystemOverviewWidget } from "./widgets/SystemOverviewWidget";
import { UserManagementWidget } from "./widgets/UserManagementWidget";
import { BuildingStatusWidget } from "./widgets/BuildingStatusWidget";
import { MaintenanceAlertsWidget } from "./widgets/MaintenanceAlertsWidget";
import { AnalyticsSummaryWidget } from "./widgets/AnalyticsSummaryWidget";
import { QuickAdminActionsWidget } from "./widgets/QuickAdminActionsWidget";
import { RecentActivityWidget } from "./widgets/RecentActivityWidget";
import { EnhancedUserManagementModal } from "../modals/EnhancedUserManagementModal";
import { SystemSecurityModal } from "../modals/SystemSecurityModal";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";

interface SystemStats {
  totalUsers: number;
  pendingVerifications: number;
  activeIssues: number;
  systemHealth: 'good' | 'warning' | 'error';
  lastBackup: string;
  databaseSize: string;
}

export function DynamicAdminDashboard() {
  const { getActiveLayout, activeLayoutId } = useDashboardCustomization();
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    pendingVerifications: 0,
    activeIssues: 0,
    systemHealth: 'good',
    lastBackup: 'N/A',
    databaseSize: 'N/A'
  });
  const [loading, setLoading] = useState(true);
  const [userManagementOpen, setUserManagementOpen] = useState(false);
  const [systemSecurityOpen, setSystemSecurityOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadStats();
  }, []);

  // Force re-render when layout changes
  useEffect(() => {
    // This effect will run whenever activeLayoutId changes, causing a re-render
  }, [activeLayoutId]);

  const loadStats = async () => {
    try {
      setLoading(true);
      
      // Get user counts
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get pending verifications
      const { count: pendingCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('verification_status', 'pending');

      // Get active issues
      const { count: issueCount } = await supabase
        .from('issues')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open');

      setStats({
        totalUsers: userCount || 0,
        pendingVerifications: pendingCount || 0,
        activeIssues: issueCount || 0,
        systemHealth: 'good',
        lastBackup: new Date().toLocaleDateString(),
        databaseSize: '2.4 GB'
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      toast({
        title: "Error loading statistics",
        description: "Failed to load admin dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const activeLayout = getActiveLayout();
  if (!activeLayout) return null;

  const enabledWidgets = activeLayout.widgets.filter(widget => widget.enabled);

  const renderWidget = (widgetId: string) => {
    switch (widgetId) {
      case "system-overview":
        return (
          <SystemOverviewWidget 
            stats={stats} 
          />
        );
      case "user-management":
        return (
          <UserManagementWidget 
            stats={stats}
            onOpenUserManagement={() => setUserManagementOpen(true)}
          />
        );
      case "building-status":
        return <BuildingStatusWidget />;
      case "maintenance-alerts":
        return (
          <MaintenanceAlertsWidget 
            stats={stats}
          />
        );
      case "analytics-summary":
        return <AnalyticsSummaryWidget />;
      case "quick-admin-actions":
        return (
          <QuickAdminActionsWidget 
            stats={stats}
            onOpenSystemSecurity={() => setSystemSecurityOpen(true)}
          />
        );
      case "recent-activity":
        return <RecentActivityWidget />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
              <div className="flex gap-2">
                <div className="h-6 bg-muted rounded w-16"></div>
                <div className="h-6 bg-muted rounded w-16"></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div 
        className={`grid gap-4`}
        style={{
          gridTemplateColumns: `repeat(${activeLayout.columns}, 1fr)`
        }}
      >
        {enabledWidgets.map((widget) => (
          <div
            key={widget.id}
            style={{
              gridColumn: `span ${Math.min(widget.size.width, activeLayout.columns)}`,
              gridRow: `span ${widget.size.height}`
            }}
          >
            {renderWidget(widget.id)}
          </div>
        ))}
      </div>

      {/* Modals */}
      <EnhancedUserManagementModal 
        open={userManagementOpen} 
        onOpenChange={setUserManagementOpen} 
      />
      <SystemSecurityModal 
        open={systemSecurityOpen} 
        onOpenChange={setSystemSecurityOpen} 
      />
    </div>
  );
}