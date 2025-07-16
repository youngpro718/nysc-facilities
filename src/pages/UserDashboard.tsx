
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
import { MobileFABs } from "@/components/ui/MobileFABs";
import { BottomTabNavigation } from "@/components/ui/BottomTabNavigation";
import { KeyRequestForm } from "@/components/requests/KeyRequestForm";
import { useOccupantAssignments } from "@/hooks/occupants/useOccupantAssignments";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { AvatarPromptModal } from "@/components/auth/AvatarPromptModal";

export default function UserDashboard() {
  const { user, profile, isLoading, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { notifications = [], isLoading: notificationsLoading, markAsRead, markAllAsRead, clearNotification, clearAllNotifications } = useNotifications(user?.id);
  const { data: occupantData } = useOccupantAssignments(user?.id || '');

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

  return (
    <div className="space-y-6 sm:space-y-8 pb-20">
      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">
          Welcome, {firstName} {lastName}!
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Here's what's happening in your organization today.
        </p>
      </div>
      
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        <NotificationCard 
          notifications={notifications} 
          onMarkAsRead={markAsRead} 
          onMarkAllAsRead={markAllAsRead}
          onClearNotification={clearNotification}
          onClearAllNotifications={clearAllNotifications}
        />
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
      <MobileFABs 
        onRequestKey={() => setShowKeyRequest(true)} 
        onReportIssue={() => setShowIssueReport(true)}
      />
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
      
      <BottomTabNavigation />
    </div>
  );
}
