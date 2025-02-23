import { useState, useEffect } from "react";
import { IssueDialog } from "@/components/issues/IssueDialog";
import { ReportedIssuesCard } from "@/components/dashboard/ReportedIssuesCard";
import { AssignedRoomsCard } from "@/components/dashboard/AssignedRoomsCard";
import { AssignedKeysCard } from "@/components/dashboard/AssignedKeysCard";
import { NotificationCard } from "@/components/dashboard/NotificationCard";
import { QuickAccess } from "@/components/dashboard/QuickAccess";
import { UserHeader } from "@/components/dashboard/UserHeader";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useDashboardSubscriptions } from "@/hooks/useDashboardSubscriptions";
import { useNotifications } from "@/hooks/useNotifications";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Loader2 } from "lucide-react";

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
  const { notifications, isLoading: notificationsLoading, markAsRead, markAllAsRead } = useNotifications();
  const isMobile = useIsMobile();

  // Calculate unread notifications
  const unreadCount = notifications.filter(n => !n.read).length;

  // Set up real-time subscriptions
  useDashboardSubscriptions(checkUserRoleAndFetchData);

  // Initial data fetch
  useEffect(() => {
    checkUserRoleAndFetchData();
  }, [checkUserRoleAndFetchData]);

  if (isLoading || notificationsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
        <QuickAccess 
          onReportIssue={() => setShowReportIssue(true)} 
          unreadNotifications={unreadCount}
        />
        
        <div id="notifications">
          <NotificationCard 
            notifications={notifications}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
          />
        </div>

        <div id="reported-issues">
          <ReportedIssuesCard issues={userIssues} />
        </div>

        <div id="assigned-rooms">
          <AssignedRoomsCard rooms={assignedRooms} />
        </div>

        <div id="assigned-keys">
          <AssignedKeysCard keys={assignedKeys} />
        </div>
      </div>

      <IssueDialog 
        open={showReportIssue} 
        onOpenChange={setShowReportIssue}
        onSuccess={checkUserRoleAndFetchData}
      />
    </div>
  );
}

