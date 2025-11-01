
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useUserData } from "./dashboard/useUserData";
import { useRoomAssignments } from "./dashboard/useRoomAssignments";
import { useUserIssues } from "./dashboard/useUserIssues";
import { useBuildingData } from "./dashboard/useBuildingData";
import { useAdminIssues } from "./dashboard/useAdminIssues";
import { useAuth } from "./useAuth";

export const useDashboardData = (isAdminDashboard: boolean = false) => {
  const { userData, profile } = useUserData();
  const { assignedRooms } = useRoomAssignments(userData?.id);
  const { userIssues, handleMarkAsSeen, refetchIssues } = useUserIssues(userData?.id);
  const { allIssues } = useAdminIssues();
  const { buildings, buildingsLoading, activities, refreshData: refreshBuildingData } = useBuildingData(userData?.id);
  const { isAdmin, isLoading } = useAuth();

  useEffect(() => {
    if (!userData?.id) return;

    const issuesSubscription = supabase
      .channel('issues_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'issues',
          filter: `created_by=eq.${userData.id}`
        },
        () => {
          refetchIssues();
        }
      )
      .subscribe();

    return () => {
      issuesSubscription.unsubscribe();
    };
  }, [userData?.id, refetchIssues]);

  const refreshData = async () => {
    if (refreshBuildingData) {
      await refreshBuildingData();
    }
    if (refetchIssues) {
      await refetchIssues();
    }
  };

  return {
    profile,
    assignedRooms,
    userIssues,
    buildings,
    buildingsLoading,
    activities,
    handleMarkAsSeen,
    // Admin specific properties
    issues: allIssues,
    isLoading,
    isAdmin,
    refreshData
  };
};
