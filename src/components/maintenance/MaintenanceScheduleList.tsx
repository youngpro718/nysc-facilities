import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, MapPin, User, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";

type MaintenanceSchedule = {
  id: string;
  title: string;
  description: string;
  maintenance_type: string;
  space_name: string;
  space_type: string;
  scheduled_start_date: string;
  scheduled_end_date: string;
  status: string;
  priority: string;
  impact_level: string;
  notes: string;
  estimated_cost: number;
};

export const MaintenanceScheduleList = () => {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const { data: schedules, isLoading, refetch } = useQuery({
    queryKey: ["maintenance-schedules", statusFilter, typeFilter],
    queryFn: async () => {
      let query = supabase
        .from("maintenance_schedules")
        .select("*")
        .order("scheduled_start_date", { ascending: true });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }
      if (typeFilter !== "all") {
        query = query.eq("maintenance_type", typeFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as MaintenanceSchedule[];
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled": return "bg-blue-100 text-blue-800";
      case "in_progress": return "bg-yellow-100 text-yellow-800";
      case "completed": return "bg-green-100 text-green-800";
      case "postponed": return "bg-orange-100 text-orange-800";
      case "cancelled": return "bg-red-100 text-red-800";
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

  const updateStatus = async (id: string, newStatus: string) => {
    const updates: any = { status: newStatus };
    
    if (newStatus === "in_progress" && !schedules?.find(s => s.id === id)?.scheduled_start_date) {
      updates.actual_start_date = new Date().toISOString();
    }
    if (newStatus === "completed") {
      updates.actual_end_date = new Date().toISOString();
    }

    const { error } = await supabase
      .from("maintenance_schedules")
      .update(updates)
      .eq("id", id);

    if (!error) {
      refetch();
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading maintenance schedules...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="postponed">Postponed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="painting">Painting</SelectItem>
            <SelectItem value="flooring">Flooring</SelectItem>
            <SelectItem value="electrical">Electrical</SelectItem>
            <SelectItem value="hvac">HVAC</SelectItem>
            <SelectItem value="plumbing">Plumbing</SelectItem>
            <SelectItem value="general">General</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {schedules?.map((schedule) => (
          <Card key={schedule.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{schedule.title}</CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {schedule.space_name} ({schedule.space_type})
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(schedule.scheduled_start_date), "MMM dd, yyyy")}
                      {schedule.scheduled_end_date && 
                        ` - ${format(new Date(schedule.scheduled_end_date), "MMM dd, yyyy")}`
                      }
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge className={getPriorityColor(schedule.priority)}>
                    {schedule.priority}
                  </Badge>
                  <Badge className={getStatusColor(schedule.status)}>
                    {schedule.status.replace("_", " ")}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {schedule.description && (
                  <p className="text-sm text-muted-foreground">{schedule.description}</p>
                )}
                
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span className="capitalize">{schedule.maintenance_type}</span>
                  </div>
                  {schedule.impact_level !== "minimal" && (
                    <div className="flex items-center gap-1 text-orange-600">
                      <AlertCircle className="h-4 w-4" />
                      <span className="capitalize">{schedule.impact_level} impact</span>
                    </div>
                  )}
                  {schedule.estimated_cost && (
                    <span className="text-green-600">
                      Est. ${schedule.estimated_cost.toLocaleString()}
                    </span>
                  )}
                </div>

                {schedule.notes && (
                  <div className="text-sm">
                    <strong>Notes:</strong> {schedule.notes}
                  </div>
                )}

                {schedule.status === "scheduled" && (
                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      onClick={() => updateStatus(schedule.id, "in_progress")}
                    >
                      Start Maintenance
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => updateStatus(schedule.id, "postponed")}
                    >
                      Postpone
                    </Button>
                  </div>
                )}

                {schedule.status === "in_progress" && (
                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      onClick={() => updateStatus(schedule.id, "completed")}
                    >
                      Mark Complete
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {schedules?.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No maintenance schedules found
        </div>
      )}
    </div>
  );
};