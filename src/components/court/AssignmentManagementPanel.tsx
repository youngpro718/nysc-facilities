import { EnhancedCourtAssignmentTable } from "./EnhancedCourtAssignmentTable";
import { useCourtIssuesIntegration } from "@/hooks/useCourtIssuesIntegration";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, AlertTriangle, Users, Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const AssignmentManagementPanel = () => {
  const { getCourtImpactSummary } = useCourtIssuesIntegration();
  const impactSummary = getCourtImpactSummary();

  const { data: assignmentStats } = useQuery({
    queryKey: ["assignment-stats"],
    queryFn: async () => {
      // Get all court rooms with their availability status
      const { data: courtrooms } = await supabase
        .from("court_rooms")
        .select("id, room_id, room_number, is_active");
      
      const { data: assignments } = await supabase
        .from("court_assignments")
        .select("room_id, part")
        .not("part", "is", null)
        .not("part", "eq", "");

      const { data: shutdowns } = await supabase
        .from("room_shutdowns")
        .select("court_room_id, status, temporary_location, reason")
        .or("status.eq.in_progress,status.eq.scheduled");

      const totalCourtrooms = courtrooms?.length || 0;
      


      // Create maps for quick lookup
      const shutdownMap = new Map(shutdowns?.map(s => [s.court_room_id, s]) || []);
      
      // Count rooms by actual availability
      let availableCount = 0;
      let assignedCount = 0;
      let shutdownCount = 0;
      let relocatedCount = 0;
      // track inactive rooms only for flow control; not surfaced in metrics

      const assignedRoomIds = new Set((assignments || []).map((a: any) => a.room_id).filter(Boolean));

      courtrooms?.forEach(room => {
        const roomShutdown = shutdownMap.get(room.id);
        // Check if room has a part assigned using room_id key
        const hasAssignment = assignedRoomIds.has(room.room_id);

        if (roomShutdown && (roomShutdown.status === "in_progress" || roomShutdown.status === "scheduled")) {
          shutdownCount++;
          if (roomShutdown.temporary_location) {
            relocatedCount++;
          }
        } else if (!room.is_active) {
          // skip counting if inactive
        } else if (hasAssignment) {
          assignedCount++;
        } else {
          availableCount++;
        }
      });

      return {
        totalCourtrooms,
        assignedRooms: assignedCount,
        availableRooms: availableCount,
        shutdownRooms: shutdownCount,
        temporarilyRelocated: relocatedCount,
        unassignedRooms: availableCount
      };
    },
  });



  return (
    <div className="space-y-6">
      {/* Header with Impact Summary */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Assignment Management</h2>
          <p className="text-muted-foreground">
            Manage court assignments with dropdown personnel selection and real-time issue monitoring
          </p>
        </div>
        <div className="flex items-center gap-2">
          {impactSummary && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {impactSummary.totalAffectedRooms} Affected
              </Badge>
              {impactSummary.urgentIssues > 0 && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {impactSummary.urgentIssues} Urgent
                </Badge>
              )}
            </div>
          )}
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courtrooms</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignmentStats?.totalCourtrooms || 0}</div>
            <p className="text-xs text-muted-foreground">All courtrooms</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupied</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{assignmentStats?.assignedRooms || 0}</div>
            <p className="text-xs text-muted-foreground">Currently in use</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{assignmentStats?.availableRooms || 0}</div>
            <p className="text-xs text-muted-foreground">Ready for assignment</p>
          </CardContent>
        </Card>

        {/* Removed Under Maintenance card due to unavailable metric */}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temporarily Relocated</CardTitle>
            <MapPin className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{assignmentStats?.temporarilyRelocated || 0}</div>
            <p className="text-xs text-muted-foreground">Operating from alternate location</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shutdown</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{assignmentStats?.shutdownRooms || 0}</div>
            <p className="text-xs text-muted-foreground">Temporarily closed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {impactSummary?.totalAffectedRooms || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Rooms with issues
              {impactSummary?.urgentIssues ? ` (${impactSummary.urgentIssues} urgent)` : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Assignment Table */}
      <Card>
        <CardHeader>
          <CardTitle>Court Assignments</CardTitle>
          <CardDescription>
            Click on any cell to edit. Use dropdowns to select personnel from the database.
            Rooms with issues are highlighted and show warning icons.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EnhancedCourtAssignmentTable />
        </CardContent>
      </Card>



      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
            <p className="text-sm">
              <strong>Personnel Selection:</strong> Click on Justice, Clerks, or Sergeant fields to open dropdown menus with available personnel from the database.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
            <p className="text-sm">
              <strong>Real-time Integration:</strong> Rooms with issues are automatically highlighted. Urgent issues show red backgrounds, regular issues show yellow.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
            <p className="text-sm">
              <strong>Drag & Drop:</strong> Use the grip handle to reorder assignments. Changes are saved automatically.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
            <p className="text-sm">
              <strong>Notifications:</strong> You'll receive alerts when new issues affect assigned courtrooms.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};