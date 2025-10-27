/**
 * USER DASHBOARD - REDESIGNED FOR USER PRIORITIES
 * 
 * This dashboard has been redesigned to prioritize what users need most:
 * 
 * 1. SUPPLY REQUESTS (Priority #1)
 *    - Featured section with visual pipeline showing exact fulfillment stage
 *    - Progress bars and time tracking
 *    - Expandable details with item lists and notes
 *    - Prominent "New Request" button
 * 
 * 2. COURT ASSIGNMENTS (Priority #2)
 *    - Full term view showing ALL filled courtrooms
 *    - User's assignment highlighted with star badge
 *    - Complete personnel details (justice, clerk, sergeant)
 *    - Contact information and room numbers
 *    - Real-time updates every 30 seconds
 * 
 * 3. ISSUE REPORTING (Always Visible)
 *    - Prominent "Report Issue" button in header
 *    - Opens full issue reporting wizard
 *    - Quick access from anywhere on the page
 * 
 * 4. QUICK STATS
 *    - Active supply requests
 *    - Pending key requests
 *    - Open issues
 *    - Keys held
 * 
 * 5. SECONDARY FEATURES
 *    - Notifications
 *    - Key assignments
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
import { NotificationCard } from "@/components/dashboard/NotificationCard";
import { KeyAssignmentCard } from "@/components/dashboard/KeyAssignmentCard";
import { EnhancedSupplyTracker } from "@/components/user/EnhancedSupplyTracker";
import { TermSheetBoard } from "@/components/court-operations/personnel/TermSheetBoard";
import { QuickIssueReportButton } from "@/components/user/QuickIssueReportButton";
import { NotificationDropdown } from "@/components/user/NotificationDropdown";
import { useUserPersonnelInfo } from "@/hooks/user/useUserPersonnelInfo";
import { AvatarPromptModal } from "@/components/auth/AvatarPromptModal";
import { PullToRefresh } from "@/components/ui/PullToRefresh";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { UserInfoCard } from "@/components/dashboard/UserInfoCard";
import { Bell, Package, Key, AlertTriangle, CheckCircle, Wrench } from "lucide-react";

export default function UserDashboard() {
  const { user, profile, isLoading, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // Performance tracking
  const [dashboardLoadStart] = useState(() => performance.now());
  
  // Data hooks - with performance logging
  const { notifications = [], isLoading: notificationsLoading, markAsRead, markAllAsRead, clearNotification, clearAllNotifications, refetch: refetchNotifications } = useNotifications(user?.id);
  const { data: supplyRequests = [], refetch: refetchSupplyRequests, isLoading: supplyLoading } = useSupplyRequests(user?.id);
  const { data: keyRequests = [], refetch: refetchKeyRequests, isLoading: keyLoading } = useKeyRequests(user?.id);
  const { userIssues = [], refetchIssues, isLoading: issuesLoading } = useUserIssues(user?.id);
  const { data: personnelInfo, isLoading: personnelLoading } = useUserPersonnelInfo(user?.id);

  const [showAvatarPrompt, setShowAvatarPrompt] = useState(false);
  const [avatarPromptDismissed, setAvatarPromptDismissed] = useState(false);

  // Performance logging - log when all data is loaded
  useEffect(() => {
    if (!isLoading && !notificationsLoading && !supplyLoading && !keyLoading && !issuesLoading && !personnelLoading) {
      const totalLoadTime = performance.now() - dashboardLoadStart;
      console.log(`📊 Dashboard fully loaded in ${totalLoadTime.toFixed(2)}ms`);
      console.log('Data summary:', {
        notifications: notifications.length,
        supplyRequests: supplyRequests.length,
        keyRequests: keyRequests.length,
        issues: userIssues.length,
        hasPersonnelInfo: !!personnelInfo
      });
    }
  }, [isLoading, notificationsLoading, supplyLoading, keyLoading, issuesLoading, personnelLoading, dashboardLoadStart, notifications, supplyRequests, keyRequests, userIssues, personnelInfo]);

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
      refetchSupplyRequests(),
      refetchKeyRequests(),
      refetchIssues()
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

  // Calculate stats
  const activeSupplyRequests = supplyRequests.filter(r => !['fulfilled', 'rejected', 'cancelled'].includes(r.status)).length;
  const pendingKeyRequests = keyRequests.filter(r => r.status === 'pending').length;
  const openIssues = userIssues.filter(i => i.status === 'open').length;
  const keysHeld = keyAssignments.length;

  return (
    <PullToRefresh onRefresh={handleRefresh} enabled={isMobile}>
      <div className="space-y-6 pb-20 px-3 sm:px-0">
        {/* Header with Actions */}
        <div className="flex items-center justify-between pt-2">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="flex items-center gap-2">
            <NotificationDropdown
              notifications={notifications}
              onMarkAsRead={markAsRead}
              onMarkAllAsRead={markAllAsRead}
              onClearNotification={clearNotification}
              onClearAllNotifications={clearAllNotifications}
            />
            <QuickIssueReportButton 
              variant="default"
              size={isMobile ? "sm" : "default"}
              label={isMobile ? "Report" : "Report Issue"}
              showIcon={!isMobile}
              className="touch-manipulation"
            />
          </div>
        </div>

        {/* User Info Card */}
        <UserInfoCard
          firstName={firstName}
          lastName={lastName}
          email={user?.email}
          department={(profile as any)?.department || (personnelInfo as any)?.department}
          roomNumber={(profile as any)?.room_number || personnelInfo?.roomNumber}
          extension={(profile as any)?.extension || personnelInfo?.extension}
          avatarUrl={profile?.avatar_url}
          supplyRequestsCount={activeSupplyRequests}
          openIssuesCount={openIssues}
          keysHeldCount={keysHeld}
        />

        {/* Tabbed Content */}
        <Tabs defaultValue="supply-requests" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="supply-requests" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Supply Requests</span>
              <span className="sm:hidden">Supplies</span>
              {activeSupplyRequests > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {activeSupplyRequests}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              <span className="hidden sm:inline">Maintenance</span>
              <span className="sm:hidden">Issues</span>
              {openIssues > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {openIssues}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="keys" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Keys
              {keysHeld > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {keysHeld}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="supply-requests" className="space-y-4">
            <EnhancedSupplyTracker 
              requests={supplyRequests}
              featured={false}
            />
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  My Issues & Maintenance Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userIssues.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No issues reported</p>
                    <p className="text-sm mt-1">Click "Report Issue" to submit a new request</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userIssues.map((issue) => (
                      <div key={issue.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{issue.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {issue.description}
                            </p>
                          </div>
                          <Badge variant={issue.status === 'open' ? 'destructive' : 'secondary'}>
                            {issue.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="keys" className="space-y-4">
            <KeyAssignmentCard userId={user.id} />
          </TabsContent>
        </Tabs>
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
