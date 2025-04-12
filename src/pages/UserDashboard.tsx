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
import { Loader2, ChevronDown } from "lucide-react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { IssueDialogManager } from "@/components/issues/components/IssueDialogManager";
import { useDialogManager } from "@/hooks/useDialogManager";
import { RoomDetails } from "@/components/rooms/RoomDetails";
import { Issue } from "@/components/issues/types/IssueTypes";
import { UserIssue } from "@/types/dashboard";

const convertToIssueType = (userIssues: UserIssue[]): Issue[] => {
  return userIssues.map(issue => ({
    ...issue,
    updated_at: issue.created_at,
    type: 'general'
  })) as Issue[];
};

interface DashboardSectionProps {
  id: string;
  title: string;
  children: React.ReactNode;
  isCollapsible?: boolean;
  defaultExpanded?: boolean;
  priority?: 'high' | 'medium' | 'low';
  badge?: number;
}

function DashboardSection({ 
  id, 
  title, 
  children, 
  isCollapsible = true,
  defaultExpanded = true,
  priority = 'medium',
  badge
}: DashboardSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const isMobile = useIsMobile();

  const shouldBeCollapsible = isMobile;

  return (
    <div 
      id={id}
      className={cn(
        "transition-all duration-200 rounded-lg",
        priority === 'high' ? 'order-first' : 
        priority === 'low' ? 'order-last' : '',
        !shouldBeCollapsible && 'bg-card border shadow-sm'
      )}
    >
      {shouldBeCollapsible && (
        <Button
          variant="ghost"
          className={cn(
            "w-full flex items-center justify-between py-3 px-4",
            "rounded-lg bg-card border shadow-sm",
            isExpanded && "rounded-b-none border-b-0"
          )}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold">{title}</span>
            {badge && badge > 0 && (
              <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs font-medium">
                {badge}
              </span>
            )}
          </div>
          <ChevronDown 
            className={cn(
              "h-5 w-5 transition-transform duration-200",
              isExpanded ? "transform rotate-180" : ""
            )} 
          />
        </Button>
      )}
      <div className={cn(
        "transition-all duration-200",
        shouldBeCollapsible ? [
          isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0",
          "overflow-hidden",
          isExpanded && "bg-card border border-t-0 rounded-b-lg shadow-sm"
        ] : "h-auto"
      )}>
        {children}
      </div>
    </div>
  );
}

export default function UserDashboard() {
  const [showReportIssue, setShowReportIssue] = useState(false);
  const { isLoading, isAuthenticated } = useAuth();
  const { dialogState, openDialog, closeDialog } = useDialogManager();
  const {
    profile,
    assignedRooms,
    userIssues,
    handleMarkAsSeen,
    error: dashboardError
  } = useDashboardData(false);

  const { 
    notifications, 
    isLoading: notificationsLoading, 
    markAsRead, 
    markAllAsRead 
  } = useNotifications();

  const isMobile = useIsMobile();
  const unreadCount = notifications.filter(n => !n.read).length;
  const hasUnreadNotifications = unreadCount > 0;
  const hasActiveIssues = userIssues.length > 0;

  useDashboardSubscriptions({ userId: profile?.id });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (dashboardError) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p className="text-red-500">Error loading dashboard: {dashboardError.message}</p>
      </div>
    );
  }

  const convertedIssues = convertToIssueType(userIssues);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8 max-w-6xl">
          <UserHeader 
            profile={profile}
            isMobile={isMobile}
            onReportIssue={() => setShowReportIssue(true)}
          />

          <ScrollArea className="h-[calc(100vh-5rem)]">
            <div className="space-y-3 pb-20">
              <DashboardSection 
                id="quick-access"
                title="Quick Access"
                isCollapsible={false}
                priority="high"
              >
                <QuickAccess 
                  onReportIssue={() => setShowReportIssue(true)} 
                  unreadNotifications={unreadCount}
                />
              </DashboardSection>

              <DashboardSection 
                id="notifications"
                title="Notifications"
                defaultExpanded={hasUnreadNotifications}
                priority={hasUnreadNotifications ? 'high' : 'medium'}
                badge={unreadCount}
              >
                <NotificationCard 
                  notifications={notifications}
                  onMarkAsRead={markAsRead}
                  onMarkAllAsRead={markAllAsRead}
                />
              </DashboardSection>

              <DashboardSection 
                id="reported-issues"
                title="Reported Issues"
                defaultExpanded={hasActiveIssues}
                priority={hasActiveIssues ? 'high' : 'medium'}
                badge={userIssues.length}
              >
                <ReportedIssuesCard issues={convertedIssues} />
              </DashboardSection>

              <DashboardSection 
                id="assigned-rooms"
                title="Assigned Rooms"
                priority="medium"
                badge={assignedRooms.length}
              >
                <AssignedRoomsCard rooms={assignedRooms} />
              </DashboardSection>

              <DashboardSection 
                id="assigned-keys"
                title="Assigned Keys"
                priority="medium"
              >
                <AssignedKeysCard keys={[]} />
              </DashboardSection>
            </div>
          </ScrollArea>
        </div>

        <IssueDialog 
          open={showReportIssue} 
          onOpenChange={setShowReportIssue}
          assignedRooms={assignedRooms}
        />
        
        <IssueDialogManager
          dialogState={dialogState}
          onClose={closeDialog}
        />

        {dialogState.type === 'roomDetails' && dialogState.isOpen && (
          <RoomDetails
            roomId={dialogState.data?.roomId}
            isOpen={dialogState.isOpen}
            onClose={closeDialog}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
