import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InteractiveOperationsDashboard } from "@/components/court/InteractiveOperationsDashboard";
import { AssignmentManagementPanel } from "@/components/court/AssignmentManagementPanel";
import { SetTemporaryLocationDialog } from "@/components/court/SetTemporaryLocationDialog";
import { TermSheetBoard } from "@/components/court-operations/personnel/TermSheetBoard";
import { StaffAbsenceManager } from "@/components/court-operations/StaffAbsenceManager";
import { ConflictDetectionPanel } from "@/components/court-operations/ConflictDetectionPanel";
import { MapPin, Users, FileText, UserX, AlertTriangle } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCourtIssuesIntegration } from "@/hooks/useCourtIssuesIntegration";
import { useConditionalNotifications } from "@/hooks/useConditionalNotifications";
import { Button } from "@/components/ui/button";

export const CourtOperationsDashboard = () => {

  const [tempLocationOpen, setTempLocationOpen] = useState(false);
  const [selectedCourtRoom, setSelectedCourtRoom] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const tab = searchParams.get('tab') || 'operations';

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
        <TabsList className="flex w-full">
          <TabsTrigger value="operations" className="flex items-center gap-2">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            Operations Overview
          </TabsTrigger>
          <TabsTrigger
            value="assignments"
            className={`flex items-center gap-2 ${showAssignmentsGlow ? 'relative ring-2 ring-amber-400 animate-pulse' : ''}`}
          >
            {showAssignmentsGlow && (
              <span className="absolute -top-1 -right-1 inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
            )}
            <Users className="h-4 w-4 flex-shrink-0" />
            Manage Assignments
          </TabsTrigger>
          <TabsTrigger value="absences" className="flex items-center gap-2">
            <UserX className="h-4 w-4 flex-shrink-0" />
            Staff Absences
          </TabsTrigger>
          <TabsTrigger value="conflicts" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            Conflict Detection
          </TabsTrigger>
          <TabsTrigger value="term-sheet" className="flex items-center gap-2">
            <FileText className="h-4 w-4 flex-shrink-0" />
            Term Sheet
          </TabsTrigger>
        </TabsList>

        <TabsContent value="operations">
          <InteractiveOperationsDashboard />
        </TabsContent>

        <TabsContent value="assignments">
          <AssignmentManagementPanel />
        </TabsContent>

        <TabsContent value="absences">
          <StaffAbsenceManager />
        </TabsContent>

        <TabsContent value="conflicts">
          <ConflictDetectionPanel />
        </TabsContent>

        <TabsContent value="term-sheet">
          <TermSheetBoard />
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