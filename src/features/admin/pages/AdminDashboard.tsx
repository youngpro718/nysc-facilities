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

const AdminDashboard = () => {
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

  const buildingList = (buildings as unknown[]) ?? [];
  const hasBuildings = buildingList.length > 0;

  const content = (
    <div className="space-y-6 sm:space-y-8">
      <AdminGreeting
        onRefresh={refreshData}
        isLoading={isLoading || buildingsLoading}
      />

      <ProductionSecurityGuard />

      {hasBuildings ? (
        <BuildingsGrid
          buildings={buildings as never}
          isLoading={buildingsLoading}
          issues={issues}
          activities={activities}
          onMarkAsSeen={handleMarkAsSeen}
        />
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[240px] gap-3 rounded-lg border border-dashed bg-muted/30 p-8 text-center">
          <Building2 className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
          <div className="space-y-1">
            <p className="font-medium">No buildings found</p>
            <p className="text-sm text-muted-foreground">
              Add a building to see facility overviews and live status here.
            </p>
          </div>
        </div>
      )}

      {/* Command Center — alerts and quick actions below building overview */}
      <CommandCenter />
    </div>
  );

  if (isMobile) {
    return <PullToRefresh onRefresh={refreshData}>{content}</PullToRefresh>;
  }
  return content;
};

export default AdminDashboard;
