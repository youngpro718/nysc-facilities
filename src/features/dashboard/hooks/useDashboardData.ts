
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

    // Coalesce realtime issue changes. Before, every issue UPDATE on the
    // admin dashboard fanned out into 4 separate invalidations + a refetch,
    // each turning the top progress bar back on. Now we do a single
    // predicate-based invalidation and debounce rapid bursts so a 5-issue
    // status change still costs only one round of refetches.
    let pendingTimer: ReturnType<typeof setTimeout> | null = null;
    const invalidateIssueQueries = () => {
      queryClient.invalidateQueries({
        predicate: (q) => {
          const k = q.queryKey[0];
          return (
            k === 'allIssues' ||
            k === 'adminIssues' ||
            k === 'adminIssueStats' ||
            k === 'userIssues'
          );
        },
      });
    };
    const handleIssueChange = () => {
      // Same debounce on the non-admin path: standard users subscribe to BOTH
      // a `created_by` and a `reported_by` filter, and most rows match both
      // (a user usually creates and reports their own issue), so any UPDATE
      // used to fire refetchIssues twice. Coalescing to a single refetch.
      if (pendingTimer) return;
      pendingTimer = setTimeout(() => {
        pendingTimer = null;
        if (isAdminDashboard) {
          invalidateIssueQueries();
        } else {
          refetchIssues();
        }
      }, 200);
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
      if (pendingTimer) clearTimeout(pendingTimer);
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
    // Command center renders its own query (metrics/alerts/activity) — one
    // visible "Refresh data" action should refresh the whole page, not just
    // the building cards above it.
    await queryClient.invalidateQueries({ queryKey: ['command-center'] });
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
