
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUserData } from "./useUserData";
import { useRoomAssignments } from "./useRoomAssignments";
import { useUserIssues } from "./useUserIssues";
import { useBuildingData } from "./useBuildingData";
import { useAdminIssues } from "./useAdminIssues";
import { useAuth } from "@features/auth/hooks/useAuth";

export const useDashboardData = (isAdminDashboard: boolean = false) => {
  const queryClient = useQueryClient();
  const { userData, profile } = useUserData();
  const { assignedRooms } = useRoomAssignments(userData?.id);
  const { userIssues, handleMarkAsSeen, refetchIssues } = useUserIssues(userData?.id);
  const { allIssues } = useAdminIssues();
  const { buildings, buildingsLoading, activities, refreshData: refreshBuildingData } = useBuildingData(userData?.id);
  const { isAdmin, isLoading } = useAuth();

  useEffect(() => {
    if (!userData?.id) return;

    const handleIssueChange = () => {
      if (isAdminDashboard) {
        void Promise.all([
          refetchIssues(),
          queryClient.invalidateQueries({ queryKey: ['allIssues'] }),
          queryClient.invalidateQueries({ queryKey: ['adminIssues'] }),
          queryClient.invalidateQueries({ queryKey: ['adminIssueStats'] }),
        ]);
        return;
      }

      refetchIssues();
    };

    const subscriptions = isAdminDashboard
      ? [
          supabase
            .channel('admin_issues_channel')
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'issues',
              },
              handleIssueChange
            )
            .subscribe(),
        ]
      : [
          supabase
            .channel('user_issues_created_channel')
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'issues',
                filter: `created_by=eq.${userData.id}`,
              },
              handleIssueChange
            )
            .subscribe(),
          supabase
            .channel('user_issues_reported_channel')
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'issues',
                filter: `reported_by=eq.${userData.id}`,
              },
              handleIssueChange
            )
            .subscribe(),
        ];

    return () => {
      subscriptions.forEach(subscription => subscription.unsubscribe());
    };
  }, [isAdminDashboard, queryClient, refetchIssues, userData?.id]);

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
