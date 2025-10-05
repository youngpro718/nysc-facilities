
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationCard } from "@/components/dashboard/NotificationCard";
import { RoomAssignmentCard } from "@/components/dashboard/RoomAssignmentCard";
import { KeyAssignmentCard } from "@/components/dashboard/KeyAssignmentCard";
import { IssueSummaryCard } from "@/components/dashboard/IssueSummaryCard";
import { StorageRoomCard } from "@/components/dashboard/StorageRoomCard";
import { SupplyRequestCard } from "@/components/dashboard/SupplyRequestCard";
import { ProfileCompletionCard } from "@/components/profile/ProfileCompletionCard";
import { ReportIssueWizard } from "@/components/issues/wizard/ReportIssueWizard";
import { BottomTabNavigation } from "@/components/ui/BottomTabNavigation";
import { KeyRequestForm } from "@/components/requests/KeyRequestForm";
import { useOccupantAssignments } from "@/hooks/occupants/useOccupantAssignments";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { AvatarPromptModal } from "@/components/auth/AvatarPromptModal";
import { PullToRefresh } from "@/components/ui/PullToRefresh";
import { useIsMobile } from "@/hooks/use-mobile";

export default function UserDashboard() {
  const { user, profile, isLoading, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { notifications = [], isLoading: notificationsLoading, markAsRead, markAllAsRead, clearNotification, clearAllNotifications, refetch: refetchNotifications } = useNotifications(user?.id);
  const { data: occupantData, refetch: refetchOccupant } = useOccupantAssignments(user?.id || '');

  const [showKeyRequest, setShowKeyRequest] = useState(false);
  const [showIssueReport, setShowIssueReport] = useState(false);
  const [showAvatarPrompt, setShowAvatarPrompt] = useState(false);
  const [avatarPromptDismissed, setAvatarPromptDismissed] = useState(false);

  // Add debug logging for auth state
  console.log("UserDashboard: Auth state", { isLoading, isAuthenticated, isAdmin, userId: user?.id });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log("UserDashboard: Not authenticated, redirecting to login");
      navigate("/login");
    }
  }, [isLoading, isAuthenticated, navigate]);

  // Show avatar prompt for users without profile pictures
  useEffect(() => {
    if (
      !isLoading && 
      isAuthenticated && 
      profile && 
      !profile.avatar_url && 
      !avatarPromptDismissed &&
      !showAvatarPrompt
    ) {
      // Show prompt after a short delay to avoid interrupting page load
      const timer = setTimeout(() => {
        setShowAvatarPrompt(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, isAuthenticated, profile, avatarPromptDismissed, showAvatarPrompt]);

  // Handle refresh for pull-to-refresh
  const handleRefresh = async () => {
    await Promise.all([
      refetchNotifications(),
      refetchOccupant()
    ]);
  };

  // Show loading state while authentication is being determined
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    console.log("UserDashboard: Not authenticated or no user, returning null");
    return null;
  }

  console.log("UserDashboard: Rendering dashboard for user", user.id);

  // Get user name from profile or fallback to user_metadata/email
  const firstName = profile?.first_name || user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'User';
  const lastName = profile?.last_name || user?.user_metadata?.last_name || '';

  const hasAssignments = Boolean(
    (occupantData?.roomAssignments?.length || 0) > 0 ||
    (occupantData?.keyAssignments?.length || 0) > 0 ||
    (occupantData?.storageAssignments?.length || 0) > 0 ||
    occupantData?.primaryRoom
  );
  const hasContent = hasAssignments || (notifications?.length || 0) > 0;

  return (
    <PullToRefresh onRefresh={handleRefresh} enabled={isMobile}>
      <div className="space-y-6 sm:space-y-8 pb-20">
      <div className="space-y-1">
        <h2 className="text-lg sm:text-xl font-semibold tracking-tight">
          Welcome, {firstName} {lastName}!
        </h2>
        <p className="text-sm text-muted-foreground">
          Here's what's happening in your organization today.
        </p>
      </div>
      
      {!hasContent && (
        <div className="rounded-lg border bg-card text-card-foreground p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">Let’s get you set up</h3>
              <p className="text-sm text-muted-foreground mt-1">
                You don’t have any notifications or assignments yet. Try creating your first issue or requesting a key.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                onClick={() => setShowIssueReport(true)}
              >
                Report an Issue
              </button>
              <button
                className="inline-flex items-center rounded-md border px-3 py-2 text-sm hover:bg-accent"
                onClick={() => setShowKeyRequest(true)}
              >
                Request a Key
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        {notificationsLoading ? (
          <div className="rounded-lg border p-4">
            <div className="h-4 w-40 bg-muted animate-pulse rounded mb-3" />
            <div className="space-y-2">
              <div className="h-3 w-full bg-muted animate-pulse rounded" />
              <div className="h-3 w-5/6 bg-muted animate-pulse rounded" />
              <div className="h-3 w-2/3 bg-muted animate-pulse rounded" />
            </div>
          </div>
        ) : (
          <NotificationCard 
            notifications={notifications} 
            onMarkAsRead={markAsRead} 
            onMarkAllAsRead={markAllAsRead}
            onClearNotification={clearNotification}
            onClearAllNotifications={clearAllNotifications}
          />
        )}
        <ProfileCompletionCard />
        <RoomAssignmentCard 
          roomAssignments={occupantData?.roomAssignments || []} 
          keyAssignments={occupantData?.keyAssignments || []}
          primaryRoom={occupantData?.primaryRoom}
          onReportIssue={(roomId) => {
            console.log("UserDashboard: Reporting issue for room", roomId);
            setShowIssueReport(true);
          }}
        />
        <KeyAssignmentCard userId={user.id} />
        <IssueSummaryCard userId={user.id} />
        <SupplyRequestCard />
        {occupantData?.storageAssignments && occupantData.storageAssignments.length > 0 && (
          <StorageRoomCard 
            storageAssignments={occupantData.storageAssignments}
          />
        )}
      </div>
      
      <KeyRequestForm 
        open={showKeyRequest} 
        onClose={() => setShowKeyRequest(false)}
        onSubmit={async data => {
          setShowKeyRequest(false);
          try {
            // @ts-ignore
            const { submitKeyRequest } = await import('@/services/supabase/keyRequestService');
            
            await submitKeyRequest({
              reason: data.reason,
              user_id: user.id,
              request_type: data.request_type,
              room_id: data.room_id || null,
              room_other: data.room_other || null,
              quantity: data.quantity,
              emergency_contact: data.emergency_contact || null,
              email_notifications_enabled: data.email_notifications_enabled,
            });
            // @ts-ignore
            const { toast } = await import('sonner');
            toast.success('Key request submitted!');
            // Optionally: refresh dashboard cards
          } catch (err: any) {
            // @ts-ignore
            const { toast } = await import('sonner');
            toast.error('Failed to submit key request.');
          }
        } }
      />
      <Dialog open={showIssueReport} onOpenChange={setShowIssueReport}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogTitle className="sr-only">Report an Issue</DialogTitle>
          <ReportIssueWizard
            onSuccess={() => setShowIssueReport(false)}
            onCancel={() => setShowIssueReport(false)}
            assignedRooms={occupantData?.roomAssignments || []}
          />
        </DialogContent>
      </Dialog>
      
      <AvatarPromptModal
        open={showAvatarPrompt}
        onOpenChange={setShowAvatarPrompt}
        onComplete={() => {
          setAvatarPromptDismissed(true);
          setShowAvatarPrompt(false);
        }}
      />
      </div>
    </PullToRefresh>
  );
}
