import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Calendar, Clock, Wrench } from "lucide-react";
import { format } from "date-fns";

interface CourtMaintenance {
  court_id: string;
  room_number: string;
  maintenance_status: string;
  maintenance_start_date: string | null;
  maintenance_end_date: string | null;
  maintenance_notes: string | null;
  schedule_id: string | null;
  maintenance_title: string | null;
  scheduled_start_date: string | null;
  scheduled_end_date: string | null;
  schedule_status: string | null;
};

export const CourtMaintenancePanel = () => {
  const { data: maintenanceData, isLoading } = useQuery({
    queryKey: ["court-maintenance-v2"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("court_maintenance_view")
        .select("*")
        .not("schedule_id", "is", null)
        .order("scheduled_start_date", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled": return "bg-blue-100 text-blue-800";
      case "in_progress": return "bg-yellow-100 text-yellow-800";
      case "completed": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getImpactIcon = (level: string) => {
    switch (level) {
      case "full_closure": return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case "significant": return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default: return <Wrench className="h-4 w-4 text-blue-600" />;
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading maintenance impact data...</div>;
  }

  const activeMaintenanceCount = maintenanceData?.filter(m => 
    m.maintenance_status_detail === "in_progress" || m.maintenance_status_detail === "scheduled"
  ).length || 0;

  const highImpactCount = maintenanceData?.filter(m => 
    m.impact_level === "significant" || m.impact_level === "full_closure"
  ).length || 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Maintenance</CardTitle>
            <Wrench className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{activeMaintenanceCount}</div>
            <p className="text-xs text-muted-foreground">Scheduled or in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Impact Work</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{highImpactCount}</div>
            <p className="text-xs text-muted-foreground">Significant disruption expected</p>
          </CardContent>
        </Card>
      </div>

      {/* Maintenance List */}
      <div className="grid gap-4">
        {maintenanceData?.map((maintenance) => (
          <Card key={`${maintenance.court_id}-${maintenance.schedule_id}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {getImpactIcon(maintenance.impact_level)}
                    {maintenance.maintenance_title}
                  </CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                    <div>
                      Courtroom {maintenance.courtroom_number || maintenance.room_number}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(maintenance.scheduled_start_date), "MMM dd, yyyy")}
                      {maintenance.scheduled_end_date && 
                        ` - ${format(new Date(maintenance.scheduled_end_date), "MMM dd, yyyy")}`
                      }
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge className={getPriorityColor(maintenance.priority)}>
                    {maintenance.priority}
                  </Badge>
                  <Badge className={getStatusColor(maintenance.maintenance_status_detail)}>
                    {maintenance.maintenance_status_detail?.replace("_", " ")}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-1">
                    <Wrench className="h-4 w-4" />
                    <span className="capitalize">{maintenance.maintenance_type}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="capitalize">{maintenance.impact_level?.replace("_", " ")} impact</span>
                  </div>
                </div>

                {maintenance.temporary_location && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-800 font-medium">
                      <Clock className="h-4 w-4" />
                      Temporary Location Active
                    </div>
                    <p className="text-sm mt-1 text-blue-700">{maintenance.temporary_location}</p>
                  </div>
                )}

                {maintenance.maintenance_notes && (
                  <div className="text-sm">
                    <strong>Maintenance Notes:</strong> {maintenance.maintenance_notes}
                  </div>
                )}

                {(maintenance.impact_level === "significant" || maintenance.impact_level === "full_closure") && (
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-orange-800 font-medium">
                      <AlertTriangle className="h-4 w-4" />
                      High Impact Maintenance
                    </div>
                    <p className="text-sm mt-1 text-orange-700">
                      This maintenance work will significantly impact courtroom availability.
                      {maintenance.impact_level === "full_closure" && " Courtroom will be fully closed during this period."}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {maintenanceData?.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No maintenance work affecting courtrooms found</p>
        </div>
      )}
    </div>
  );
};