
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useUserData } from "./useUserData";
import { useRoomAssignments } from "./useRoomAssignments";
import { useUserIssues } from "./useUserIssues";
import { useBuildingData } from "./useBuildingData";
import { useAdminIssues } from "./useAdminIssues";
import { useAuth } from "@features/auth/hooks/useAuth";

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
