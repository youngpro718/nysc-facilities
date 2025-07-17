import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { BuildingsGrid } from "@/components/dashboard/BuildingsGrid";
import { SupplyRequestsWidget } from "@/components/dashboard/SupplyRequestsWidget";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useEffect } from "react";
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
  } = useDashboardData(true); // Pass true for admin dashboard

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

  if (!buildings || buildings.length === 0) {
    return (
      <div className="space-y-8">
        <DashboardHeader onRefresh={refreshData} isLoading={isLoading} />
        <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground">
          <p>No buildings found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <DashboardHeader onRefresh={refreshData} isLoading={isLoading || buildingsLoading} />
      
      {/* Quick Access Widgets */}
      <div className="grid gap-6 md:grid-cols-3">
        <SupplyRequestsWidget />
      </div>
      
      <BuildingsGrid
        buildings={buildings}
        isLoading={buildingsLoading}
        issues={issues}
        activities={activities}
        onMarkAsSeen={handleMarkAsSeen}
      />
    </div>
  );
};

export default AdminDashboard;