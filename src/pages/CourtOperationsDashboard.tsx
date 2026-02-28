import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { StatusCard } from "@/components/ui/StatusCard";
import { TodaysStatusDashboard } from "@/components/court-operations/TodaysStatusDashboard";
import { AssignmentManagementPanel } from "@/components/court/AssignmentManagementPanel";
import { SetTemporaryLocationDialog } from "@/components/court/SetTemporaryLocationDialog";
import { StaffAbsenceManager } from "@/components/court-operations/StaffAbsenceManager";
import { ConflictDetectionPanel } from "@/components/court-operations/ConflictDetectionPanel";
import { DailySessionsPanel } from "@/components/court-operations/DailySessionsPanel";
import { LiveCourtGrid } from "@/components/court/LiveCourtGrid";
import {
  Activity,
  Users,
  CalendarCheck,
  Radio,
  UserX,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useCourtIssuesIntegration } from "@/hooks/useCourtIssuesIntegration";
import { useConditionalNotifications } from "@/hooks/useConditionalNotifications";
import { useCourtOperationsCounts } from "@/hooks/useCourtOperationsCounts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export const CourtOperationsDashboard = () => {
  const [tempLocationOpen, setTempLocationOpen] = useState(false);
  const [selectedCourtRoom, setSelectedCourtRoom] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "today";

  // Get counts for tab badges
  const counts = useCourtOperationsCounts();

  // Determine when to glow/highlight the Assignments tab
  const { getRecentlyAffectedRooms } = useCourtIssuesIntegration();
  const recentlyAffectedRooms = getRecentlyAffectedRooms();
  const { lastAdminNotification } = useConditionalNotifications();

  const showAssignmentsGlow = useMemo(() => {
    const attentionFromIssues = (recentlyAffectedRooms?.length || 0) > 0;
    const attentionFromAdmin = !!(
      lastAdminNotification &&
      ["new_issue", "issue_status_change"].includes(
        (lastAdminNotification as unknown as { notification_type: string }).notification_type
      )
    );
    return (attentionFromIssues || attentionFromAdmin) && tab !== "assignments";
  }, [recentlyAffectedRooms, lastAdminNotification, tab]);

  // Fetch current term info from court_assignments (most recent data)
  const { data: termInfo } = useQuery({
    queryKey: ["current-term-info"],
    queryFn: async () => {
      const { count } = await supabase
        .from("court_assignments")
        .select("*", { count: "exact", head: true });

      return {
        totalParts: count || 0,
      };
    },
    staleTime: 1000 * 60 * 5,
  });

  const setTab = (val: string) => {
    setSearchParams({
      tab: val,
      ...(searchParams.get("room") ? { room: searchParams.get("room")! } : {}),
    });
  };

  // Tab configuration — flat structure, no nesting
  const tabs = [
    {
      value: "today",
      label: "Today",
      mobileLabel: "Today",
      icon: Activity,
      badge: counts.todaysSessions > 0 ? counts.todaysSessions : null,
      badgeVariant: "secondary" as const,
    },
    {
      value: "sessions",
      label: "Sessions",
      mobileLabel: "Sessions",
      icon: CalendarCheck,
      badge: counts.dailySessions > 0 ? counts.dailySessions : null,
      badgeVariant: "outline" as const,
    },
    {
      value: "assignments",
      label: "Assignments",
      mobileLabel: "Assign",
      icon: Users,
      badge: counts.assignmentsNeedingAttention > 0 ? counts.assignmentsNeedingAttention : null,
      badgeVariant: "destructive" as const,
      glow: showAssignmentsGlow,
    },
    {
      value: "staff",
      label: "Staff",
      mobileLabel: "Staff",
      icon: UserX,
      badge: counts.uncoveredAbsences > 0 ? counts.uncoveredAbsences : null,
      badgeVariant: "destructive" as const,
    },
    {
      value: "live",
      label: "Live Status",
      mobileLabel: "Live",
      icon: Radio,
      badge: null,
      badgeVariant: "secondary" as const,
    },
  ];

  return (
    <div className="container mx-auto px-3 sm:px-6 py-2 sm:py-4 space-y-3 sm:space-y-4 pb-24 md:pb-8">

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
        <StatusCard
          statusVariant={counts.todaysSessions > 0 ? "info" : "neutral"}
          title="Today's Sessions"
          value={counts.todaysSessions}
          subLabel={counts.todaysSessions > 0 ? "Active" : "None scheduled"}
          icon={CalendarCheck}
          onClick={() => setTab("sessions")}
        />
        <StatusCard
          statusVariant={counts.assignmentsNeedingAttention > 0 ? "warning" : "operational"}
          title="Assignments"
          value={termInfo?.totalParts || 0}
          subLabel={counts.assignmentsNeedingAttention > 0 ? `${counts.assignmentsNeedingAttention} need attention` : "All covered"}
          icon={Users}
          onClick={() => setTab("assignments")}
        />
        <StatusCard
          statusVariant={counts.uncoveredAbsences > 0 ? "critical" : "operational"}
          title="Staff Absences"
          value={counts.uncoveredAbsences}
          subLabel={counts.uncoveredAbsences > 0 ? "Uncovered" : "All covered"}
          icon={UserX}
          onClick={() => setTab("staff")}
        />
        <StatusCard
          statusVariant={counts.dailySessions > 0 ? "info" : "neutral"}
          title="Daily Sessions"
          value={counts.dailySessions}
          subLabel={counts.dailySessions > 0 ? "Scheduled today" : "None today"}
          icon={Activity}
          onClick={() => setTab("sessions")}
        />
      </div>

      {/* Tabs — sticky + horizontal scroll on mobile */}
      <Tabs value={tab} onValueChange={setTab} className="w-full" data-tour="court-term-board">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm -mx-3 sm:mx-0 px-3 sm:px-0 py-1 scrollbar-hide overflow-x-auto">
          <TabsList className="inline-flex w-auto min-w-full sm:w-full h-auto p-1 gap-1 touch-manipulation">
            {tabs.map((t) => {
              const Icon = t.icon;
              return (
                <TabsTrigger
                  key={t.value}
                  value={t.value}
                  className={`
                    relative flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm
                    whitespace-nowrap flex-shrink-0 min-w-0 touch-manipulation
                    ${t.glow ? "ring-2 ring-amber-400 animate-pulse" : ""}
                  `}
                >
                  {t.glow && (
                    <span className="absolute -top-1 -right-1 inline-flex h-2 w-2 rounded-full bg-amber-500" />
                  )}
                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="hidden sm:inline">{t.label}</span>
                  <span className="sm:hidden">{t.mobileLabel}</span>
                  {t.badge !== null && (
                    <Badge
                      variant={t.badgeVariant}
                      className="ml-0.5 h-4 min-w-[16px] px-1 text-[10px] leading-none"
                    >
                      {t.badge}
                    </Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {/* Today's Status */}
        <TabsContent value="today" className="mt-4" data-tour="court-status-dashboard">
          <TodaysStatusDashboard onNavigateToTab={setTab} />
        </TabsContent>

        {/* Daily Sessions */}
        <TabsContent value="sessions" className="mt-4" data-tour="court-sessions">
          <DailySessionsPanel />
        </TabsContent>

        {/* Assignments */}
        <TabsContent value="assignments" className="mt-4" data-tour="court-personnel">
          <AssignmentManagementPanel />
        </TabsContent>

        {/* Staff & Conflicts (merged) */}
        <TabsContent value="staff" className="mt-4">
          <div className="space-y-6">
            <StaffAbsenceManager />
            <ConflictDetectionPanel />
          </div>
        </TabsContent>

        {/* Live Grid (promoted from nested tab) */}
        <TabsContent value="live" className="mt-4">
          <LiveCourtGrid />
        </TabsContent>
      </Tabs>

      <SetTemporaryLocationDialog
        open={tempLocationOpen}
        onOpenChange={setTempLocationOpen}
        courtroomId={selectedCourtRoom}
      />
    </div>
  );
};