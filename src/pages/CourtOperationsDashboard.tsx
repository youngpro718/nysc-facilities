import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TodaysStatusDashboard } from "@/components/court-operations/TodaysStatusDashboard";
import { AssignmentManagementPanel } from "@/components/court/AssignmentManagementPanel";
import { SetTemporaryLocationDialog } from "@/components/court/SetTemporaryLocationDialog";
import { StaffAbsenceManager } from "@/components/court-operations/StaffAbsenceManager";
import { ConflictDetectionPanel } from "@/components/court-operations/ConflictDetectionPanel";
import { DailySessionsPanel } from "@/components/court-operations/DailySessionsPanel";
import { LiveCourtGrid } from "@/components/court/LiveCourtGrid";
import { Activity, Users, CalendarCheck, Wrench } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCourtIssuesIntegration } from "@/hooks/useCourtIssuesIntegration";
import { useConditionalNotifications } from "@/hooks/useConditionalNotifications";
import { useCourtOperationsCounts } from "@/hooks/useCourtOperationsCounts";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/layout/Breadcrumb";

export const CourtOperationsDashboard = () => {

  const [tempLocationOpen, setTempLocationOpen] = useState(false);
  const [selectedCourtRoom, setSelectedCourtRoom] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const tab = searchParams.get('tab') || 'today';

  // Get counts for tab badges
  const counts = useCourtOperationsCounts();

  // Determine when to glow/highlight the Manage Assignments tab
  const { getRecentlyAffectedRooms } = useCourtIssuesIntegration();
  const recentlyAffectedRooms = getRecentlyAffectedRooms();
  const { lastAdminNotification } = useConditionalNotifications();

  const showAssignmentsGlow = useMemo(() => {
    const attentionFromIssues = (recentlyAffectedRooms?.length || 0) > 0;
    const attentionFromAdmin = !!(lastAdminNotification && ['new_issue', 'issue_status_change'].includes((lastAdminNotification as any).notification_type));
    // Only glow when not already on the assignments tab
    return (attentionFromIssues || attentionFromAdmin) && tab !== 'assignments';
  }, [recentlyAffectedRooms, lastAdminNotification, tab]);

  const handleSetTemporaryLocation = (courtroomId: string) => {
    setSelectedCourtRoom(courtroomId);
    setTempLocationOpen(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Breadcrumb />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Court Operations</h1>
          <p className="text-muted-foreground">
            Manage courtrooms, terms, and maintenance schedules
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/court-live')}>
            Open Live Grid
          </Button>
        </div>
      </div>

      <Tabs
        value={tab}
        onValueChange={(val) =>
          setSearchParams({
            tab: val,
            room: searchParams.get('room') || undefined,
          })
        }
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="today" className="flex items-center gap-2">
            <Activity className="h-4 w-4 flex-shrink-0" />
            Today's Status
            {counts.todaysSessions > 0 && (
              <Badge variant="secondary" className="ml-1">
                {counts.todaysSessions}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="daily-sessions" className="flex items-center gap-2">
            <CalendarCheck className="h-4 w-4 flex-shrink-0" />
            Daily Sessions
            {counts.dailySessions > 0 && (
              <Badge variant="outline" className="ml-1">
                {counts.dailySessions}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="assignments"
            className={`flex items-center gap-2 ${showAssignmentsGlow ? 'relative ring-2 ring-amber-400 animate-pulse' : ''}`}
          >
            {showAssignmentsGlow && (
              <span className="absolute -top-1 -right-1 inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
            )}
            <Users className="h-4 w-4 flex-shrink-0" />
            Full Assignments
            {counts.assignments > 0 && (
              <Badge variant="destructive" className="ml-1">
                {counts.assignments}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="management" className="flex items-center gap-2">
            <Wrench className="h-4 w-4 flex-shrink-0" />
            Management Tools
            {counts.maintenanceIssues > 0 && (
              <Badge variant="destructive" className="ml-1">
                {counts.maintenanceIssues}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today">
          <TodaysStatusDashboard 
            onNavigateToTab={(tab) => setSearchParams({ tab })}
          />
        </TabsContent>

        <TabsContent value="daily-sessions">
          <DailySessionsPanel />
        </TabsContent>

        <TabsContent value="assignments">
          <AssignmentManagementPanel />
        </TabsContent>

        <TabsContent value="management">
          <Tabs defaultValue="absences" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="absences">Staff Absences</TabsTrigger>
              <TabsTrigger value="live-grid">Live Grid</TabsTrigger>
              <TabsTrigger value="conflicts">Conflict Detection</TabsTrigger>
            </TabsList>
            <TabsContent value="absences" className="mt-4">
              <StaffAbsenceManager />
            </TabsContent>
            <TabsContent value="live-grid" className="mt-4">
              <LiveCourtGrid />
            </TabsContent>
            <TabsContent value="conflicts" className="mt-4">
              <ConflictDetectionPanel />
            </TabsContent>
          </Tabs>
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