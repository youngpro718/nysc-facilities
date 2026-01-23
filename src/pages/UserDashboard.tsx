/**
 * USER DASHBOARD - EMPLOYEE WORK PORTAL
 * 
 * Redesigned as a personalized daily work hub:
 * 
 * 1. PERSONALIZED GREETING
 *    - Time-aware greeting with date
 *    - User's workspace info (room, department)
 * 
 * 2. PICKUP ALERT BANNER
 *    - Prominent notification when supplies are ready
 * 
 * 3. REQUEST STATUS GRID
 *    - At-a-glance view of supplies, issues, keys
 *    - Click to expand details
 * 
 * 4. QUICK ACTIONS
 *    - Request Supplies, Report Issue always visible
 * 
 * 5. DETAILED SECTIONS
 *    - Expandable supply tracker
 *    - Issue list
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
import { KeyAssignmentCard } from "@/components/dashboard/KeyAssignmentCard";
import { EnhancedSupplyTracker } from "@/components/user/EnhancedSupplyTracker";
import { QuickIssueReportButton } from "@/components/user/QuickIssueReportButton";
import { NotificationDropdown } from "@/components/user/NotificationDropdown";
import { useUserPersonnelInfo } from "@/hooks/user/useUserPersonnelInfo";
import { AvatarPromptModal } from "@/components/auth/AvatarPromptModal";
import { PullToRefresh } from "@/components/ui/PullToRefresh";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserWorkspaceCard } from "@/components/user/UserWorkspaceCard";
import { RequestStatusGrid } from "@/components/user/RequestStatusGrid";
import { PickupAlertBanner } from "@/components/user/PickupAlertBanner";
import { 
  Package, 
  AlertTriangle, 
  Wrench,
  ChevronDown,
  ChevronUp
} from "lucide-react";

export default function UserDashboard() {
  const { user, profile, isLoading, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // Expanded section state
  const [expandedSection, setExpandedSection] = useState<'supplies' | 'issues' | 'keys' | null>('supplies');
  
  // Data hooks
  const { notifications = [], isLoading: notificationsLoading, markAsRead, markAllAsRead, clearNotification, clearAllNotifications, refetch: refetchNotifications } = useNotifications(user?.id);
  const { data: supplyRequests = [], refetch: refetchSupplyRequests, isLoading: supplyLoading } = useSupplyRequests(user?.id);
  const { data: keyRequests = [], refetch: refetchKeyRequests, isLoading: keyLoading } = useKeyRequests(user?.id);
  const { userIssues = [], refetchIssues, isLoading: issuesLoading } = useUserIssues(user?.id);
  const { data: personnelInfo, isLoading: personnelLoading } = useUserPersonnelInfo(user?.id);

  const [showAvatarPrompt, setShowAvatarPrompt] = useState(false);
  const [avatarPromptDismissed, setAvatarPromptDismissed] = useState(false);

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
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
  const activeSupplyRequests = supplyRequests.filter(r => !['fulfilled', 'rejected', 'cancelled', 'completed'].includes(r.status)).length;
  const readyForPickup = supplyRequests.filter(r => r.status === 'ready').length;
  const pendingKeyRequests = keyRequests.filter(r => r.status === 'pending').length;
  const openIssues = userIssues.filter(i => i.status === 'open').length;
  const inProgressIssues = userIssues.filter(i => i.status === 'in_progress').length;
  const keysHeld = keyAssignments.length;

  const toggleSection = (section: 'supplies' | 'issues' | 'keys') => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <PullToRefresh onRefresh={handleRefresh} enabled={isMobile}>
      <div className="space-y-4 sm:space-y-6 pb-20 px-3 sm:px-0">
        {/* Header with Actions */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <NotificationDropdown
              notifications={notifications}
              onMarkAsRead={markAsRead}
              onMarkAllAsRead={markAllAsRead}
              onClearNotification={clearNotification}
              onClearAllNotifications={clearAllNotifications}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size={isMobile ? "sm" : "default"}
              onClick={() => navigate('/request')}
              className="touch-manipulation"
            >
              <Package className="h-4 w-4 mr-1" />
              {isMobile ? "Request" : "New Request"}
            </Button>
            <QuickIssueReportButton 
              variant="outline"
              size={isMobile ? "sm" : "default"}
              label={isMobile ? "Report" : "Report Issue"}
              showIcon={!isMobile}
              className="touch-manipulation"
            />
          </div>
        </div>

        {/* Personalized Workspace Card */}
        <UserWorkspaceCard
          firstName={firstName}
          lastName={lastName}
          title={(profile as any)?.title || personnelInfo?.title}
          department={(profile as any)?.department || (personnelInfo as any)?.department}
          roomNumber={(profile as any)?.room_number || personnelInfo?.roomNumber}
          extension={(profile as any)?.extension || personnelInfo?.extension}
          avatarUrl={profile?.avatar_url}
          role={personnelInfo?.role}
        />

        {/* Pickup Alert Banner */}
        <PickupAlertBanner 
          count={readyForPickup} 
          onClick={() => toggleSection('supplies')}
        />

        {/* Request Status Grid */}
        <RequestStatusGrid
          activeSupplyRequests={activeSupplyRequests}
          readyForPickup={readyForPickup}
          openIssues={openIssues}
          inProgressIssues={inProgressIssues}
          keysHeld={keysHeld}
          pendingKeyRequests={pendingKeyRequests}
          onViewSupplies={() => toggleSection('supplies')}
          onViewIssues={() => toggleSection('issues')}
          onViewKeys={() => toggleSection('keys')}
        />

        {/* Expandable Sections */}
        <div className="space-y-3">
          {/* Supply Requests Section */}
          <Card className={expandedSection === 'supplies' ? 'ring-2 ring-primary/20' : ''}>
            <CardHeader 
              className="cursor-pointer py-3"
              onClick={() => toggleSection('supplies')}
            >
              <CardTitle className="flex items-center justify-between text-base">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  Supply Requests
                  {activeSupplyRequests > 0 && (
                    <Badge variant="secondary">{activeSupplyRequests} active</Badge>
                  )}
                </div>
                {expandedSection === 'supplies' ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </CardTitle>
            </CardHeader>
            {expandedSection === 'supplies' && (
              <CardContent className="pt-0">
                <EnhancedSupplyTracker 
                  requests={supplyRequests}
                  featured={false}
                />
              </CardContent>
            )}
          </Card>

          {/* Issues Section */}
          <Card className={expandedSection === 'issues' ? 'ring-2 ring-primary/20' : ''}>
            <CardHeader 
              className="cursor-pointer py-3"
              onClick={() => toggleSection('issues')}
            >
              <CardTitle className="flex items-center justify-between text-base">
                <div className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-orange-600" />
                  Reported Issues
                  {openIssues > 0 && (
                    <Badge variant="destructive">{openIssues} open</Badge>
                  )}
                </div>
                {expandedSection === 'issues' ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </CardTitle>
            </CardHeader>
            {expandedSection === 'issues' && (
              <CardContent className="pt-0">
                {userIssues.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No issues reported</p>
                    <p className="text-sm mt-1">Click "Report Issue" to submit a new request</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userIssues.slice(0, 5).map((issue) => (
                      <div key={issue.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium truncate">{issue.title}</h4>
                              <Badge 
                                variant={
                                  issue.priority === 'urgent' || issue.priority === 'high' 
                                    ? 'destructive' 
                                    : 'outline'
                                }
                                className="text-xs"
                              >
                                {issue.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {issue.description}
                            </p>
                            {(issue.unified_spaces?.name || issue.buildings?.name) && (
                              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <span>📍</span>
                                {issue.buildings?.name}
                                {issue.unified_spaces?.name && ` - ${issue.unified_spaces.name}`}
                              </p>
                            )}
                          </div>
                          <Badge 
                            variant={
                              issue.status === 'open' ? 'destructive' : 
                              issue.status === 'in_progress' ? 'secondary' : 
                              'outline'
                            }
                          >
                            {issue.status === 'in_progress' ? 'In Progress' : issue.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {userIssues.length > 5 && (
                      <Button 
                        variant="ghost" 
                        className="w-full" 
                        onClick={() => navigate('/my-issues')}
                      >
                        View {userIssues.length - 5} more issues
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            )}
          </Card>

          {/* Keys Section */}
          <Card className={expandedSection === 'keys' ? 'ring-2 ring-primary/20' : ''}>
            <CardHeader 
              className="cursor-pointer py-3"
              onClick={() => toggleSection('keys')}
            >
              <CardTitle className="flex items-center justify-between text-base">
                <div className="flex items-center gap-2">
                  <span className="text-green-600">🔑</span>
                  Keys & Access
                  {keysHeld > 0 && (
                    <Badge variant="secondary">{keysHeld} held</Badge>
                  )}
                </div>
                {expandedSection === 'keys' ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </CardTitle>
            </CardHeader>
            {expandedSection === 'keys' && (
              <CardContent className="pt-0">
                <KeyAssignmentCard userId={user.id} />
              </CardContent>
            )}
          </Card>
        </div>
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
