
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { BuildingsGrid } from "@/components/dashboard/BuildingsGrid";
import { useAdminDashboardData } from "@/hooks/useAdminDashboardData";
import { useEffect } from "react";

const AdminDashboard = () => {
  const {
    buildings,
    buildingsLoading,
    issues,
    activities,
    handleMarkAsSeen,
    fetchAdminData
  } = useAdminDashboardData();

  useEffect(() => {
    fetchAdminData();
  }, []);

  return (
    <div className="space-y-8">
      <DashboardHeader />
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
