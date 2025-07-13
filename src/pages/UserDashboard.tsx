
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationCard } from "@/components/dashboard/NotificationCard";
import { RoomAssignmentCard } from "@/components/dashboard/RoomAssignmentCard";
import { KeyAssignmentCard } from "@/components/dashboard/KeyAssignmentCard";
import { IssueSummaryCard } from "@/components/dashboard/IssueSummaryCard";
import { ReportIssueWizard } from "@/components/issues/wizard/ReportIssueWizard";
import { MobileFABs } from "@/components/ui/MobileFABs";
import { BottomTabNavigation } from "@/components/ui/BottomTabNavigation";
import { KeyRequestForm } from "@/components/requests/KeyRequestForm";
import { useRoomAssignments } from "@/hooks/dashboard/useRoomAssignments";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export default function UserDashboard() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { notifications = [], isLoading: notificationsLoading, markAsRead, markAllAsRead, clearNotification, clearAllNotifications } = useNotifications(user?.id);
  const { assignedRooms } = useRoomAssignments(user?.id);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isLoading, isAuthenticated, navigate]);

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
    return null;
  }

  // Get user name from user_metadata or email
  const firstName = user.user_metadata?.first_name || user.email?.split('@')[0] || 'User';
  const lastName = user.user_metadata?.last_name || '';

  const [showKeyRequest, setShowKeyRequest] = useState(false);
  const [showIssueReport, setShowIssueReport] = useState(false);

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
        {/* Room assignments will be added later */}
        <KeyAssignmentCard userId={user.id} />
        <IssueSummaryCard userId={user.id} />
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
            assignedRooms={assignedRooms}
          />
        </DialogContent>
      </Dialog>
      <BottomTabNavigation />
    </div>
  );
}
