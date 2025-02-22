
import { useState } from "react";
import { IssueDialog } from "@/components/issues/IssueDialog";
import { ReportedIssuesCard } from "@/components/dashboard/ReportedIssuesCard";
import { AssignedRoomsCard } from "@/components/dashboard/AssignedRoomsCard";
import { AssignedKeysCard } from "@/components/dashboard/AssignedKeysCard";
import { UserHeader } from "@/components/dashboard/UserHeader";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useDashboardSubscriptions } from "@/hooks/useDashboardSubscriptions";
import { useIsMobile } from "@/hooks/useIsMobile";

export default function UserDashboard() {
  const [showReportIssue, setShowReportIssue] = useState(false);
  const {
    isLoading,
    assignedRooms,
    assignedKeys,
    userIssues,
    profile,
    checkUserRoleAndFetchData
  } = useDashboardData();
  const isMobile = useIsMobile();

  // Set up real-time subscriptions
  useDashboardSubscriptions(checkUserRoleAndFetchData);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <UserHeader 
        profile={profile}
        isMobile={isMobile}
        onReportIssue={() => setShowReportIssue(true)}
      />

      <div className="grid gap-3 sm:gap-6">
        <ReportedIssuesCard issues={userIssues} />
        <AssignedRoomsCard rooms={assignedRooms} />
        <AssignedKeysCard keys={assignedKeys} />
      </div>

      <IssueDialog 
        open={showReportIssue} 
        onOpenChange={setShowReportIssue}
        onSuccess={checkUserRoleAndFetchData}
      />
    </div>
  );
}

