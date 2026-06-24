// Admin Dashboard — Command Center + Building Overview
import { AdminGreeting } from "@features/dashboard/components/dashboard/AdminGreeting";
import { CommandCenter } from "@features/dashboard/components/dashboard/CommandCenter";
import { BuildingsGrid } from "@features/dashboard/components/dashboard/BuildingsGrid";
import { ProductionSecurityGuard } from "@features/auth/components/security/ProductionSecurityGuard";
import { useDashboardData } from "@features/dashboard/hooks/useDashboardData";
import { Building2 } from "lucide-react";
import { PullToRefresh } from "@/components/ui/PullToRefresh";
import { useIsMobile } from "@shared/hooks/use-mobile";
import { LoadingSkeleton } from "@shared/components/common/common/LoadingSkeleton";
import type { BuildingWithLighting } from "@/utils/dashboardUtils";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRolePermissions } from "@features/auth/hooks/useRolePermissions";
import { getDashboardForRole, isAdminRole } from "@/routes/roleBasedRouting";

const AdminDashboard = () => {
  // Dev-mode role preview: a real admin previewing a non-admin role still
  // passes the route's requireAdmin gate (it checks the REAL role), but the
  // effective role from useRolePermissions reflects the preview. Forward them
  // so previewing actually shows what the previewed role would see.
  const navigate = useNavigate();
  const { userRole: effectiveRole, loading: roleLoading } = useRolePermissions();
  useEffect(() => {
    if (roleLoading || !effectiveRole) return;
    if (!isAdminRole(effectiveRole)) {
      navigate(getDashboardForRole(effectiveRole), { replace: true });
    }
  }, [effectiveRole, roleLoading, navigate]);

  const {
    buildings,
    buildingsLoading,
    issues,
    activities,
    handleMarkAsSeen,
    refreshData,
    isLoading,
    isAdmin,
  } = useDashboardData(true);
  const isMobile = useIsMobile();
  const [lastRefreshedAt, setLastRefreshedAt] = useState(() => new Date());

  const handleRefresh = async () => {
    await refreshData();
    setLastRefreshedAt(new Date());
  };

  if (isLoading || buildingsLoading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton type="card" count={1} />
        <LoadingSkeleton type="grid" count={4} />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">You don't have access to this page</p>
      </div>
    );
  }

  const buildingList = (buildings ?? []) as BuildingWithLighting[];
  const hasBuildings = buildingList.length > 0;

  const content = (
    <div className="mx-auto max-w-[1500px] space-y-7 sm:space-y-8">
      <AdminGreeting
        onRefresh={handleRefresh}
        isLoading={isLoading || buildingsLoading}
        lastRefreshedAt={lastRefreshedAt}
      />

      <ProductionSecurityGuard />

      <section aria-labelledby="building-monitors-heading" className="space-y-4">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <h2 id="building-monitors-heading" className="text-lg font-semibold tracking-tight">
              Building monitors
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Each property shows its latest unresolved issue photo, or the courthouse image when no photo report is active.
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            {buildingList.length} monitored {buildingList.length === 1 ? "property" : "properties"}
          </p>
        </div>

        {hasBuildings ? (
          <BuildingsGrid
            buildings={buildingList}
            isLoading={buildingsLoading}
            issues={issues}
            activities={activities}
            onMarkAsSeen={handleMarkAsSeen}
          />
        ) : (
          <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-md border border-dashed bg-card p-8 text-center">
            <Building2 className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
            <div className="space-y-1">
              <p className="font-medium">No buildings found</p>
              <p className="text-sm text-muted-foreground">
                Add a building to see facility overviews and live status here.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Command Center — alerts and quick actions below building overview */}
      <CommandCenter />
    </div>
  );

  if (isMobile) {
    return <PullToRefresh onRefresh={handleRefresh}>{content}</PullToRefresh>;
  }
  return content;
};

export default AdminDashboard;
