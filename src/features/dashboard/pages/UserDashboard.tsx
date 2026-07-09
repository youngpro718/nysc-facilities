// User Dashboard — minimal action-focused portal
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@features/auth/hooks/useAuth";
import { useNotifications } from "@shared/hooks/useNotifications";
import { useSupplyRequests } from "@features/supply/hooks/useSupplyRequests";
import { useUserIssues } from "@features/dashboard/hooks/useUserIssues";
import { NotificationDropdown } from "@shared/components/user/NotificationDropdown";
import { useUserPersonnelInfo } from "@features/court/hooks/useUserPersonnelInfo";
import { PullToRefresh } from "@/components/ui/PullToRefresh";
import { useIsMobile } from "@shared/hooks/use-mobile";
import { PickupAlertBanner } from "@shared/components/user/PickupAlertBanner";
import { DashboardQuickActions } from "@features/dashboard/components/dashboard/DashboardQuickActions";
import { DashboardMyRoomCard } from "@features/dashboard/components/dashboard/DashboardMyRoomCard";
import { DashboardProfileSummaryCard } from "@features/dashboard/components/dashboard/DashboardProfileSummaryCard";
import { DashboardActivityList } from "@features/dashboard/components/dashboard/DashboardActivityList";
import { Button } from "@/components/ui/button";
import { Package, Send, ChevronRight, KeyRound } from "lucide-react";
import { getDashboardForRole } from "@/routes/roleBasedRouting";
import { useRolePermissions } from "@features/auth/hooks/useRolePermissions";
import { KeyRequestDialog } from "@features/keys/components/requests/KeyRequestDialog";

export default function UserDashboard() {
  const { user, profile, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [keyRequestOpen, setKeyRequestOpen] = useState(false);

  // Redirect non-standard roles to their own dashboard. Uses the EFFECTIVE
  // role (from useRolePermissions) instead of profile.role so a real admin
  // previewing 'standard' via DevMode stays on this page instead of bouncing
  // back to the admin dashboard the moment they switch.
  const { userRole: effectiveRole, loading: effectiveRoleLoading } = useRolePermissions();
  useEffect(() => {
    if (isLoading || effectiveRoleLoading) return;
    if (!effectiveRole || effectiveRole === "standard") return;
    const target = getDashboardForRole(effectiveRole);
    if (target && target !== "/dashboard") navigate(target, { replace: true });
  }, [isLoading, effectiveRoleLoading, effectiveRole, navigate]);

  const {
    notifications = [],
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
    refetch: refetchNotifications,
  } = useNotifications(user?.id);
  const { data: supplyRequests = [], refetch: refetchSupplyRequests } = useSupplyRequests(user?.id);
  const { userIssues = [], refetchIssues } = useUserIssues(user?.id);
  const { data: personnelInfo } = useUserPersonnelInfo(user?.id);

  // Task requests this user submitted (Move/Delivery/Setup/Pickup) — surface on dashboard My Activity.
  const { data: myTaskRequests = [], refetch: refetchTaskRequests } = useQuery({
    queryKey: ['my-task-requests', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_tasks')
        .select('id, title, status, task_type, created_at')
        .eq('requested_by', user!.id)
        .order('created_at', { ascending: false })
        .limit(25);
      if (error) throw error;
      return data || [];
    },
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate("/login");
  }, [isLoading, isAuthenticated, navigate]);

  const handleRefresh = async () => {
    await Promise.all([refetchNotifications(), refetchSupplyRequests(), refetchIssues(), refetchTaskRequests()]);
  };

  const { data: keyAssignments = [] } = useQuery({
    queryKey: ["user-key-assignments", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("key_assignments")
        .select("id")
        .eq("occupant_id", user.id)
        .is("returned_at", null);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <div className="px-4 sm:px-6 py-6 space-y-6 animate-fade-in" role="status" aria-label="Loading your dashboard">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
          <div className="space-y-2 flex-1">
            <div className="h-5 w-40 rounded bg-muted animate-pulse" />
            <div className="h-3 w-28 rounded bg-muted animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[0,1,2,3].map(i => <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />)}
        </div>
        <div className="space-y-3">
          {[0,1,2].map(i => <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />)}
        </div>
        <span className="sr-only">Loading…</span>
      </div>
    );
  }
  if (!isAuthenticated || !user) return null;

  const firstName = profile?.first_name || user?.user_metadata?.first_name || user?.email?.split("@")[0] || "User";
  const lastName = profile?.last_name || user?.user_metadata?.last_name || "";

  const readyRequests = supplyRequests.filter((r) => r.status === "ready");
  const readyForDelivery = readyRequests.filter((r) => (r as any).metadata?.delivery_method === "delivery").length;
  const readyForPickup = readyRequests.length - readyForDelivery;
  const activeSupplyCount = supplyRequests.filter((r) => ["submitted", "received", "picking", "in_progress"].includes(r.status)).length;
  const openRequestCount = userIssues.filter((i) => i.status === "open" || i.status === "in_progress").length;
  const keysHeld = keyAssignments.length;

  return (
    <PullToRefresh onRefresh={handleRefresh} enabled={isMobile}>
      <div className="mx-auto max-w-6xl space-y-5 pb-24 lg:pb-8 px-4 sm:px-6 lg:px-0">
        {/* Page header: title + notifications */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <p className="mb-0.5 text-xs font-medium text-primary">Home</p>
            <h1 className="text-xl font-semibold tracking-tight">My Dashboard</h1>
          </div>
          <NotificationDropdown
            notifications={notifications as any}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
            onClearNotification={clearNotification}
            onClearAllNotifications={clearAllNotifications}
          />
        </div>

        {readyForPickup > 0 && (
          <PickupAlertBanner
            count={readyForPickup}
            deliveryMethod="pickup"
            onClick={() => navigate("/my-requests")}
          />
        )}
        {readyForDelivery > 0 && (
          <PickupAlertBanner
            count={readyForDelivery}
            deliveryMethod="delivery"
            onClick={() => navigate("/my-requests")}
          />
        )}

        {/* Two-column portal: main content + rail. Rail stacks after main below lg. */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-5 items-start">
          <div className="space-y-5 min-w-0">
            <DashboardQuickActions
              actions={[
                {
                  icon: Package,
                  label: "Order Supplies",
                  sub: activeSupplyCount > 0 ? `${activeSupplyCount} in progress` : undefined,
                  onClick: () => navigate("/supplies?tab=order"),
                  prefetchPath: "/supplies",
                  accent: true,
                },
                {
                  icon: Send,
                  label: "Make a Request",
                  sub: openRequestCount > 0 ? `${openRequestCount} active` : "Move, deliver, set up & more",
                  onClick: () => navigate("/supplies?tab=request"),
                  prefetchPath: "/supplies",
                },
                {
                  icon: KeyRound,
                  label: "Request a Key",
                  sub: keysHeld > 0 ? `${keysHeld} key${keysHeld > 1 ? "s" : ""} held` : "New, replacement, spare, or temporary",
                  onClick: () => setKeyRequestOpen(true),
                },
              ]}
            />

            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-muted-foreground">My Requests</h2>
                <Button
                  variant="link"
                  size="sm"
                  className="text-xs h-auto p-0"
                  onClick={() => navigate("/my-requests")}
                >
                  View all <ChevronRight className="h-3 w-3 ml-0.5" />
                </Button>
              </div>
              <DashboardActivityList
                supplyRequests={supplyRequests as any}
                issues={userIssues as any}
                taskRequests={myTaskRequests as any}
              />
            </div>
          </div>

          <div className="space-y-5">
            <DashboardProfileSummaryCard
              firstName={firstName}
              lastName={lastName}
              title={(profile as any)?.title || personnelInfo?.title}
              department={(profile as any)?.department || (personnelInfo as any)?.department}
              roomNumber={(profile as any)?.room_number || personnelInfo?.roomNumber}
              avatarUrl={profile?.avatar_url}
              role={personnelInfo?.role}
            />
            <DashboardMyRoomCard />
          </div>
        </div>
      </div>

      <KeyRequestDialog open={keyRequestOpen} onOpenChange={setKeyRequestOpen} />
    </PullToRefresh>
  );
}
