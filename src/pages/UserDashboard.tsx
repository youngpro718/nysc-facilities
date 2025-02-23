
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
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function UserDashboard() {
  const [showReportIssue, setShowReportIssue] = useState(false);
  const {
    profile,
    assignedRooms,
    userIssues,
    handleMarkAsSeen,
    error: dashboardError
  } = useDashboardData();

  const { 
    notifications, 
    isLoading: notificationsLoading, 
    markAsRead, 
    markAllAsRead 
  } = useNotifications();

  const isMobile = useIsMobile();

  // Calculate unread notifications
  const unreadCount = notifications.filter(n => !n.read).length;

  // Set up real-time subscriptions
  useDashboardSubscriptions({ userId: profile.id });

  if (dashboardError) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p className="text-red-500">Error loading dashboard: {dashboardError.message}</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
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
            <AssignedKeysCard keys={[]} />
          </div>
        </div>

        <IssueDialog 
          open={showReportIssue} 
          onOpenChange={setShowReportIssue}
          assignedRooms={assignedRooms}
        />
      </div>
    </ErrorBoundary>
  );
}

