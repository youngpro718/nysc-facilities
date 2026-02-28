// Admin Dashboard — main admin landing page
import { AdminGreeting } from "@/components/dashboard/AdminGreeting";
import { GlobalKPIStrip } from "@/components/dashboard/GlobalKPIStrip";
import { BuildingsGrid } from "@/components/dashboard/BuildingsGrid";
import { PendingSupplyApprovals } from "@/components/dashboard/PendingSupplyApprovals";
import { ProductionSecurityGuard } from "@/components/security/ProductionSecurityGuard";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Loader2 } from "lucide-react";

const AdminDashboard = () => {
  const {
    buildings,
    buildingsLoading,
    issues,
    activities,
    handleMarkAsSeen,
    refreshData,
    isLoading,
    isAdmin
  } = useDashboardData(true);

  if (isLoading || buildingsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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

  if (!buildings || (buildings as any[]).length === 0) {
    return (
      <div className="space-y-8">
        <AdminGreeting onRefresh={refreshData} isLoading={isLoading} />
        <GlobalKPIStrip />
        <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground">
          <p>No buildings found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <AdminGreeting onRefresh={refreshData} isLoading={isLoading || buildingsLoading} />
      
      <GlobalKPIStrip />
      
      <ProductionSecurityGuard />
      
      <PendingSupplyApprovals />
      
      <BuildingsGrid
        buildings={buildings as any}
        isLoading={buildingsLoading}
        issues={issues}
        activities={activities}
        onMarkAsSeen={handleMarkAsSeen}
      />
    </div>
  );
};

export default AdminDashboard;
