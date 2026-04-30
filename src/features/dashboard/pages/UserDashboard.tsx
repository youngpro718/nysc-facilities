// User Dashboard — minimal action-focused portal
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@features/auth/hooks/useAuth";
import { useNotifications } from "@shared/hooks/useNotifications";
import { useSupplyRequests } from "@features/supply/hooks/useSupplyRequests";
import { useKeyRequests } from "@features/keys/hooks/useKeyRequests";
import { useUserIssues } from "@features/dashboard/hooks/useUserIssues";
import { NotificationDropdown } from "@shared/components/user/NotificationDropdown";
import { useUserPersonnelInfo } from "@features/court/hooks/useUserPersonnelInfo";
import { PullToRefresh } from "@/components/ui/PullToRefresh";
import { useIsMobile } from "@shared/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { CompactHeader } from "@shared/components/user/CompactHeader";
import { PickupAlertBanner } from "@shared/components/user/PickupAlertBanner";
import { CompactActivitySection } from "@shared/components/user/CompactActivitySection";
import { KeyRequestDialog } from "@features/supply/components/requests/KeyRequestDialog";
import { Package, Send, Key, Loader2, ChevronRight } from "lucide-react";

export default function UserDashboard() {
  const { user, profile, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const {
    notifications = [],
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
    refetch: refetchNotifications,
  } = useNotifications(user?.id);
  const { data: supplyRequests = [], refetch: refetchSupplyRequests } = useSupplyRequests(user?.id);
  const { data: keyRequests = [], refetch: refetchKeyRequests } = useKeyRequests(user?.id);
  const { userIssues = [], refetchIssues } = useUserIssues(user?.id);
  const { data: personnelInfo } = useUserPersonnelInfo(user?.id);

  const [showKeyRequestDialog, setShowKeyRequestDialog] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate("/login");
  }, [isLoading, isAuthenticated, navigate]);

  const handleRefresh = async () => {
    await Promise.all([refetchNotifications(), refetchSupplyRequests(), refetchKeyRequests(), refetchIssues()]);
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

  const readyForPickup = supplyRequests.filter((r) => r.status === "ready").length;
  const activeSupplyCount = supplyRequests.filter((r) => ["submitted", "received", "picking", "in_progress"].includes(r.status)).length;
  const openRequestCount = userIssues.filter((i) => i.status === "open" || i.status === "in_progress").length;
  const pendingKeyRequests = keyRequests.filter((r) => r.status === "pending").length;
  const keysHeld = keyAssignments.length;

  return (
    <PullToRefresh onRefresh={handleRefresh} enabled={isMobile}>
      <div className="max-w-lg mx-auto space-y-5 pb-24 px-4 sm:px-0">
        {/* Header: greeting + notifications */}
        <div className="flex items-start justify-between gap-3 pt-3">
          <CompactHeader
            firstName={firstName}
            lastName={lastName}
            title={(profile as any)?.title || personnelInfo?.title}
            department={(profile as any)?.department || (personnelInfo as any)?.department}
            roomNumber={(profile as any)?.room_number || personnelInfo?.roomNumber}
            avatarUrl={profile?.avatar_url}
            role={personnelInfo?.role}
          />
          <NotificationDropdown
            notifications={notifications as any}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
            onClearNotification={clearNotification}
            onClearAllNotifications={clearAllNotifications}
          />
        </div>

        {/* Pickup Alert */}
        <PickupAlertBanner count={readyForPickup} onClick={() => navigate("/my-activity")} />

        {/* Primary Actions — 3 large vertical buttons */}
        <div className="space-y-3" data-tour="quick-actions">
          <ActionRow
            icon={Package}
            label="Order Supplies"
            sub={activeSupplyCount > 0 ? `${activeSupplyCount} in progress` : undefined}
            onClick={() => navigate("/request/supplies")}
            accent
          />
          <ActionRow
            icon={Send}
            label="Make a Request"
            sub={openRequestCount > 0 ? `${openRequestCount} active` : "Move, deliver, set up & more"}
            onClick={() => navigate("/request/help")}
          />
          <ActionRow
            icon={Key}
            label="Request Key"
            sub={keysHeld > 0 ? `${keysHeld} key${keysHeld !== 1 ? "s" : ""} held` : undefined}
            onClick={() => setShowKeyRequestDialog(true)}
          />
        </div>

        <KeyRequestDialog open={showKeyRequestDialog} onOpenChange={setShowKeyRequestDialog} onSuccess={() => refetchKeyRequests()} />

        {/* Activity feed — single chronological list */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">My Activity</h2>
            <Button variant="link" size="sm" className="text-xs h-auto p-0" onClick={() => navigate("/my-activity")}>
              View all <ChevronRight className="h-3 w-3 ml-0.5" />
            </Button>
          </div>
          <CompactActivitySection
            supplyRequests={supplyRequests}
            issues={userIssues}
            keysHeld={keysHeld}
            pendingKeyRequests={pendingKeyRequests}
            userId={user.id}
          />
        </div>
      </div>

    </PullToRefresh>
  );
}

/* ── Action row component ── */
function ActionRow({
  icon: Icon,
  label,
  sub,
  onClick,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  sub?: string;
  onClick: () => void;
  accent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-4 w-full rounded-xl px-5 py-4 text-left transition-colors touch-manipulation
        ${accent
          ? "bg-primary text-primary-foreground hover:bg-primary/90"
          : "bg-card border border-border hover:bg-accent text-foreground"
        }`}
    >
      <Icon className="h-6 w-6 shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="text-base font-medium">{label}</span>
        {sub && <p className={`text-xs mt-0.5 ${accent ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{sub}</p>}
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 opacity-50" />
    </button>
  );
}

