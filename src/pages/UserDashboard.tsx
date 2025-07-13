
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationCard } from "@/components/dashboard/NotificationCard";
import { RoomAssignmentCard } from "@/components/dashboard/RoomAssignmentCard";
import { KeyAssignmentCard } from "@/components/dashboard/KeyAssignmentCard";
import { IssueSummaryCard } from "@/components/dashboard/IssueSummaryCard";
import { IssueWizard } from "@/components/issues/wizard/IssueWizard";
import { MobileFABs } from "@/components/ui/MobileFABs";

import React, { useState } from "react";

export default function UserDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { notifications = [], isLoading: notificationsLoading } = useNotifications(user?.id);

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  if (!user) {
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
          onMarkAsRead={() => {}} 
          onMarkAllAsRead={() => {}} 
        />
        <RoomAssignmentCard userId={user.id} />
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
            await submitKeyRequest({ ...data, user_id: user.id });
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
      {showIssueReport && (
        <IssueWizard
          onSuccess={() => setShowIssueReport(false)}
          onCancel={() => setShowIssueReport(false)}
        />
      )}
      <BottomTabNavigation />
    </div>
  );
}

// Import the new mobile navigation, FABs, and forms
import { BottomTabNavigation } from "@/components/ui/BottomTabNavigation";
import { KeyRequestForm } from "@/components/requests/KeyRequestForm";
import { IssueReportForm } from "@/components/issues/IssueReportForm";
