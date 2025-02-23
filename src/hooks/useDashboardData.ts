
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserData } from "./dashboard/useUserData";
import { useRoomAssignments } from "./dashboard/useRoomAssignments";
import { useUserIssues } from "./dashboard/useUserIssues";
import { useAdminIssues } from "./dashboard/useAdminIssues";
import { useBuildingData } from "./dashboard/useBuildingData";
import { useAdminCheck } from "./dashboard/useAdminCheck";

export const useDashboardData = () => {
  const { userData, profile } = useUserData();
  const { assignedRooms } = useRoomAssignments(userData?.id);
  const { userIssues, handleMarkAsSeen, refetchIssues } = useUserIssues(userData?.id);
  const { allIssues } = useAdminIssues();
  const { buildings, buildingsLoading, activities } = useBuildingData(userData?.id);
  const { isLoading, error, checkUserRoleAndFetchData } = useAdminCheck();

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

  return {
    profile,
    assignedRooms,
    userIssues,
    buildings,
    buildingsLoading,
    issues: allIssues,
    activities,
    handleMarkAsSeen,
    checkUserRoleAndFetchData,
    isLoading,
    error,
  };
};
