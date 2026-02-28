import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
  FileText,
  Gavel,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useCourtIssuesIntegration } from "@/hooks/useCourtIssuesIntegration";
import { useConditionalNotifications } from "@/hooks/useConditionalNotifications";
import { useCourtOperationsCounts } from "@/hooks/useCourtOperationsCounts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";

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
      label: "Live Grid",
      mobileLabel: "Live",
      icon: Radio,
      badge: null,
      badgeVariant: "secondary" as const,
    },
  ];

  return (
    <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 pb-24 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Gavel className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate">
              Court Operations
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage courtrooms, assignments, and daily sessions
          </p>
        </div>
      </div>

      {/* Term Banner */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-3 px-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="text-sm font-medium">Criminal Term</span>
              <Badge variant="secondary" className="text-[10px] px-1.5">
                {termInfo?.totalParts || 0} Parts
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{format(new Date(), "EEEE, MMMM d, yyyy")}</span>
              {counts.todaysSessions > 0 && (
                <Badge variant="outline" className="text-[10px]">
                  {counts.todaysSessions} sessions today
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs — horizontal scroll on mobile, no grid */}
      <Tabs value={tab} onValueChange={setTab} className="w-full" data-tour="court-term-board">
        <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0 scrollbar-hide">
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