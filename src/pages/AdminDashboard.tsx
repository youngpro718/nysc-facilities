
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { BuildingsGrid } from "@/components/dashboard/BuildingsGrid";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const {
    buildings,
    buildingsLoading,
    issues,
    activities,
    handleMarkAsSeen,
    checkUserRoleAndFetchData,
    isLoading,
    isAdmin
  } = useDashboardData(true); // Pass true for admin dashboard

  useEffect(() => {
    const checkAdminAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/login');
        return;
      }

      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (roleError || !roleData || roleData.role !== 'admin') {
        toast.error('You do not have permission to access this page');
        navigate('/dashboard');
        return;
      }

      checkUserRoleAndFetchData();
    };

    checkAdminAccess();
  }, [navigate, checkUserRoleAndFetchData]);

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
        <DashboardHeader />
        <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground">
          <p>No buildings found</p>
        </div>
      </div>
    );
  }

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
