// User Dashboard — personal work portal
/**
 * USER DASHBOARD - PRACTICAL WORK PORTAL
 * 
 * Redesigned as a practical daily work hub:
 * 
 * 1. COMPACT HEADER
 *    - Time-aware greeting with date
 *    - Quick action buttons
 * 
 * 2. PICKUP ALERT BANNER
 *    - Prominent notification when supplies are ready
 * 
 * 3. TERM SHEET PREVIEW
 *    - Searchable court assignments at a glance
 *    - Who's where, contact info
 * 
 * 4. QUICK ACTIONS
 *    - Request Supplies, Report Issue
 * 
 * 5. TABBED ACTIVITY SECTION
 *    - Supplies, Issues, Keys in one place
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { useSupplyRequests } from "@/hooks/useSupplyRequests";
import { useKeyRequests } from "@/hooks/useKeyRequests";
import { useUserIssues } from "@/hooks/dashboard/useUserIssues";
import { QuickIssueReportButton } from "@/components/user/QuickIssueReportButton";
import { NotificationDropdown } from "@/components/user/NotificationDropdown";
import { useUserPersonnelInfo } from "@/hooks/user/useUserPersonnelInfo";
import { AvatarPromptModal } from "@/components/auth/AvatarPromptModal";
import { PullToRefresh } from "@/components/ui/PullToRefresh";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { CompactHeader } from "@/components/user/CompactHeader";
import { PickupAlertBanner } from "@/components/user/PickupAlertBanner";
import { TermSheetPreview } from "@/components/user/TermSheetPreview";
import { CompactActivitySection } from "@/components/user/CompactActivitySection";
import { KeyRequestDialog } from "@/components/requests/KeyRequestDialog";
import { MyRoomCard } from "@/components/user/MyRoomCard";
import { Package, HelpCircle, Key, Loader2 } from "lucide-react";

export default function UserDashboard() {
  const { user, profile, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // Data hooks
  const { 
    notifications = [], 
    markAsRead, 
    markAllAsRead, 
    clearNotification, 
    clearAllNotifications, 
    refetch: refetchNotifications 
  } = useNotifications(user?.id);
  const { data: supplyRequests = [], refetch: refetchSupplyRequests } = useSupplyRequests(user?.id);
  const { data: keyRequests = [], refetch: refetchKeyRequests } = useKeyRequests(user?.id);
  const { userIssues = [], refetchIssues } = useUserIssues(user?.id);
  const { data: personnelInfo } = useUserPersonnelInfo(user?.id);

  const [showAvatarPrompt, setShowAvatarPrompt] = useState(false);
  const [avatarPromptDismissed, setAvatarPromptDismissed] = useState(false);
  const [showKeyRequestDialog, setShowKeyRequestDialog] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
      refetchSupplyRequests(),
      refetchKeyRequests(),
      refetchIssues()
    ]);
  };

  // Query active key assignments
  const { data: keyAssignments = [] } = useQuery({
    queryKey: ['user-key-assignments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('key_assignments')
        .select('id')
        .eq('occupant_id', user.id)
        .is('returned_at', null);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  // Get user info
  const firstName = profile?.first_name || user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'User';
  const lastName = profile?.last_name || user?.user_metadata?.last_name || '';

  // Calculate stats
  const readyForPickup = supplyRequests.filter(r => r.status === 'ready').length;
  const pendingKeyRequests = keyRequests.filter(r => r.status === 'pending').length;
  const keysHeld = keyAssignments.length;

  return (
    <PullToRefresh onRefresh={handleRefresh} enabled={isMobile}>
      <div className="space-y-4 sm:space-y-6 pb-20 px-3 sm:px-0">
        {/* Header Row: Greeting + Actions */}
        <div className="flex items-start justify-between gap-3 pt-2">
          <CompactHeader
            firstName={firstName}
            lastName={lastName}
            title={(profile as any)?.title || personnelInfo?.title}
            department={(profile as any)?.department || (personnelInfo as any)?.department}
            roomNumber={(profile as any)?.room_number || personnelInfo?.roomNumber}
            avatarUrl={profile?.avatar_url}
            role={personnelInfo?.role}
          />
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <NotificationDropdown
              notifications={notifications as any}
              onMarkAsRead={markAsRead}
              onMarkAllAsRead={markAllAsRead}
              onClearNotification={clearNotification}
              onClearAllNotifications={clearAllNotifications}
            />
          </div>
        </div>

        {/* My Room Card - Shows primary assigned room */}
        <MyRoomCard userId={user.id} />

        {/* Pickup Alert Banner - Prominent when supplies are ready */}
        <PickupAlertBanner 
          count={readyForPickup} 
          onClick={() => navigate('/my-activity')}
        />

        {/* Quick Actions - All 4 request types accessible directly */}
        <div className="grid grid-cols-2 gap-3" data-tour="quick-actions">
          <Button
            variant="default"
            size="lg"
            onClick={() => navigate('/request/supplies')}
            className="h-14 touch-manipulation"
          >
            <Package className="h-5 w-5 mr-2" />
            Order Supplies
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/request/help')}
            className="h-14 touch-manipulation"
          >
            <HelpCircle className="h-5 w-5 mr-2" />
            Request Help
          </Button>
          <QuickIssueReportButton 
            variant="outline"
            size="lg"
            label="Report Issue"
            showIcon={true}
            className="h-14 touch-manipulation"
          />
          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowKeyRequestDialog(true)}
            className="h-14 touch-manipulation"
          >
            <Key className="h-5 w-5 mr-2" />
            Request Key
          </Button>
        </div>

        {/* Key Request Dialog */}
        <KeyRequestDialog
          open={showKeyRequestDialog}
          onOpenChange={setShowKeyRequestDialog}
          onSuccess={() => refetchKeyRequests()}
        />

        {/* Court Term Sheet Preview */}
        <TermSheetPreview 
          maxItems={6}
          defaultExpanded={false}
        />

        {/* Tabbed Activity Section */}
        <CompactActivitySection
          supplyRequests={supplyRequests}
          issues={userIssues}
          keysHeld={keysHeld}
          pendingKeyRequests={pendingKeyRequests}
          userId={user.id}
        />
      </div>
      
      <AvatarPromptModal
        open={showAvatarPrompt}
        onOpenChange={setShowAvatarPrompt}
        onComplete={() => {
          setAvatarPromptDismissed(true);
          setShowAvatarPrompt(false);
        }}
      />
    </PullToRefresh>
  );
}
