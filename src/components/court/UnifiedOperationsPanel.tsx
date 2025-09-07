import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, MapPin, Clock, CheckCircle, Calendar, Users } from "lucide-react";
import { format } from "date-fns";

interface UnifiedCourtStatus {
  id: string;
  room_number: string;
  courtroom_number: string | null;
  status: "available" | "maintenance" | "inactive" | "shutdown" | "assigned";
  current_location: string;
  temporary_location?: string;
  issue_description?: string;
  maintenance_start?: string;
  maintenance_end?: string;
}

interface OperationsSummary {
  total_rooms: number;
  available_now: number;
  occupied_now: number;
  under_maintenance: number;
  temporarily_relocated: number;
  shutdown_rooms: number;
  assigned_rooms: number;
}

export const UnifiedOperationsPanel = () => {
  const { data: operationsData, isLoading } = useQuery({
    queryKey: ["unified-court-operations"],
    queryFn: async () => {
      // Get courtrooms with their current status
      const { data: courtrooms } = await supabase
        .from("court_rooms")
        .select("id, room_number, courtroom_number, is_active");

      // Get court availability data
      const { data: availability } = await supabase
        .from("court_rooms")
        .select("*");

      // Get maintenance data  
      const { data: maintenance } = await supabase
        .from("maintenance_schedules")
        .select("*")
        .eq("space_type", "courtroom");

      // Build maintenance lookups for quick room mapping
      const maintenanceByRoomId = new Map<string, any[]>();
      const maintenanceByName = new Map<string, any[]>();
      (maintenance || []).forEach((m: any) => {
        if (m.space_id) {
          const arr = maintenanceByRoomId.get(m.space_id) || [];
          arr.push(m);
          maintenanceByRoomId.set(m.space_id, arr);
        } else if (m.space_name) {
          const key = String(m.space_name).toLowerCase();
          const arr = maintenanceByName.get(key) || [];
          arr.push(m);
          maintenanceByName.set(key, arr);
        }
      });

      const now = new Date();
      const isMaintenanceActive = (m: any) => {
        const status = m.status;
        if (status === "completed" || status === "cancelled") return false;
        if (status === "in_progress") return true;
        const start = m.actual_start_date || m.scheduled_start_date;
        const end = m.actual_end_date || m.scheduled_end_date;
        if (!start) return false;
        const startDt = new Date(start);
        if (!end) return now >= startDt;
        const endDt = new Date(end);
        return now >= startDt && now <= endDt;
      };

      const getActiveMaintenanceWindow = (items: any[]) => {
        const actives = (items || []).filter(isMaintenanceActive);
        if (actives.length === 0) return null;
        let start: string | null = null;
        let end: string | null = null;
        for (const m of actives) {
          const s = m.actual_start_date || m.scheduled_start_date;
          const e = m.actual_end_date || m.scheduled_end_date;
          if (s && (!start || new Date(s) < new Date(start))) start = s;
          if (e && (!end || new Date(e) > new Date(end))) end = e;
        }
        return { start, end };
      };

      // Get shutdown data
      const { data: shutdowns } = await supabase
        .from("room_shutdowns")
        .select("court_room_id, status, temporary_location, reason")
        .or("status.eq.in_progress,status.eq.scheduled");

      // Get assignments based on part field
      const { data: assignments } = await supabase
        .from("court_assignments")
        .select("room_number, part")
        .not("part", "is", null)
        .not("part", "eq", "");

      // Create maps for quick lookup
      const shutdownMap = new Map(shutdowns?.map(s => [s.court_room_id, s]) || []);
      const assignmentMap = new Map(assignments?.map(a => [a.room_number, true]) || []);

      const unifiedData: UnifiedCourtStatus[] = (courtrooms || []).map(room => {
        const roomShutdown = shutdownMap.get(room.id);
        // Check if room has a part assigned (simple assignment logic)
        const hasAssignment = assignments?.some(a => a.room_number === room.room_number && a.part);

        let status: UnifiedCourtStatus["status"] = "available";
        let issueDescription = "";
        let temporaryLocation = "";
        let maintenanceStart = "";
        let maintenanceEnd = "";
        
        // Determine active maintenance for this room (by id or by name fallback)
        const maintenanceItemsForRoom =
          (maintenanceByRoomId.get(room.id) || []) as any[];
        const nameKey = String(room.room_number || "").toLowerCase();
        const byNameItems = (maintenanceByName.get(nameKey) || []) as any[];
        const activeWindow = getActiveMaintenanceWindow([
          ...maintenanceItemsForRoom,
          ...byNameItems,
        ]);

        if (roomShutdown && ((roomShutdown as any).status === "in_progress" || (roomShutdown as any).status === "scheduled")) {
          status = "shutdown";
          issueDescription = (roomShutdown as any).reason || "Temporarily closed";
          temporaryLocation = (roomShutdown as any).temporary_location || "";
        } else if (!room.is_active) {
          status = "inactive";
          issueDescription = "Room inactive";
        } else if (activeWindow) {
          status = "maintenance";
          issueDescription = "Under maintenance";
          maintenanceStart = activeWindow.start || "";
          maintenanceEnd = activeWindow.end || "";
        } else if (hasAssignment) {
          status = "assigned";
          issueDescription = "Currently assigned";
        } else {
          status = "available";
          issueDescription = "Ready for use";
        }

        return {
          id: room.id,
          room_number: room.room_number,
          courtroom_number: room.courtroom_number,
          status,
          current_location: `Room ${room.room_number}`,
          temporary_location: temporaryLocation,
          issue_description: issueDescription,
          maintenance_start: maintenanceStart,
          maintenance_end: maintenanceEnd
        };
      });

      const summary: OperationsSummary = {
        total_rooms: courtrooms?.length || 0,
        available_now: unifiedData.filter(r => r.status === "available").length,
        occupied_now: unifiedData.filter(r => r.status === "assigned").length,
        under_maintenance: unifiedData.filter(r => r.status === "maintenance").length,
        temporarily_relocated: unifiedData.filter(r => r.temporary_location).length,
        shutdown_rooms: unifiedData.filter(r => r.status === "shutdown").length,
        assigned_rooms: unifiedData.filter(r => r.status === "assigned").length
      };

      return { rooms: unifiedData, summary };
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "available": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "maintenance": return <Clock className="h-4 w-4 text-orange-600" />;
      case "shutdown": return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case "temporary_relocation": return <MapPin className="h-4 w-4 text-blue-600" />;
      default: return <CheckCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available": return "bg-green-100 text-green-800";
      case "maintenance": return "bg-orange-100 text-orange-800";
      case "shutdown": return "bg-red-100 text-red-800";
      case "temporary_relocation": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading operations overview...</div>;
  }

  const { rooms, summary } = operationsData || { rooms: [], summary: { total_rooms: 0, available_now: 0, under_maintenance: 0, temporarily_relocated: 0, shutdown_rooms: 0, assigned_rooms: 0 } };

  return (
    <div className="space-y-6">
      {/* Operations Summary - Real Numbers */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Now</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary.available_now}</div>
            <p className="text-xs text-muted-foreground">Ready for proceedings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Under Maintenance</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{summary.under_maintenance}</div>
            <p className="text-xs text-muted-foreground">Currently unavailable</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temporarily Relocated</CardTitle>
            <MapPin className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{summary.temporarily_relocated}</div>
            <p className="text-xs text-muted-foreground">Operating from alternate location</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Work</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary.shutdown_rooms}</div>
            <p className="text-xs text-muted-foreground">Temporarily closed</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Room Status */}
      <div className="grid gap-4">
        {rooms.map(room => (
          <Card key={room.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(room.status)}
                  <div>
                    <CardTitle className="text-lg">
                      Room {room.room_number} {room.courtroom_number && `(${room.courtroom_number})`}
                    </CardTitle>
                    <Badge className={getStatusColor(room.status)}>
                      {room.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>

              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {room.issue_description && (
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm font-medium">{room.issue_description}</p>
                  </div>
                )}

                {room.temporary_location && (
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 text-blue-800 font-medium">
                      <MapPin className="h-4 w-4" />
                      Temporary Location: {room.temporary_location}
                    </div>
                  </div>
                )}

                {(room.maintenance_start && room.maintenance_end) && (
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(room.maintenance_start), "MMM dd")} - {format(new Date(room.maintenance_end), "MMM dd, yyyy")}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
