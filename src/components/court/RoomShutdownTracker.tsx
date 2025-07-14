import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, MapPin, CalendarIcon, Clock, CheckCircle2, Users, Bell } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type ShutdownReason = "Modernization" | "Maintenance" | "Cleaning" | "Emergency";

interface RoomShutdown {
  id: string;
  room_id: string;
  room_number: string;
  reason: ShutdownReason;
  start_date: string;
  end_date: string;
  temporary_location: string;
  status: "scheduled" | "in_progress" | "completed" | "delayed";
  project_notes: string;
  notifications_sent: {
    major: boolean;
    court_officer: boolean;
    clerks: boolean;
    judge: boolean;
  };
}

interface RoomShutdownTrackerProps {
  onSetTemporaryLocation: (roomId: string) => void;
}

export const RoomShutdownTracker = ({ onSetTemporaryLocation }: RoomShutdownTrackerProps) => {
  const { toast } = useToast();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterReason, setFilterReason] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<Date>();

  const { data: shutdowns, isLoading, refetch } = useQuery({
    queryKey: ["room-shutdowns", filterStatus, filterReason, selectedDate],
    queryFn: async () => {
      let query = supabase
        .from("court_rooms")
        .select(`
          id,
          room_number,
          maintenance_status,
          maintenance_start_date,
          maintenance_end_date,
          temporary_location,
          maintenance_notes
        `)
        .order("maintenance_start_date", { ascending: true });

      if (filterStatus !== "all") {
        query = query.eq("maintenance_status", filterStatus);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Transform the data to match our interface
      return data?.map(room => ({
        id: room.id,
        room_id: room.id,
        room_number: room.room_number,
        reason: "Modernization" as ShutdownReason, // Default for now
        start_date: room.maintenance_start_date || "",
        end_date: room.maintenance_end_date || "",
        temporary_location: room.temporary_location || "",
        status: room.maintenance_status === "under_maintenance" ? "in_progress" : 
                room.maintenance_status === "maintenance_scheduled" ? "scheduled" : "completed",
        project_notes: room.maintenance_notes || "",
        notifications_sent: {
          major: false,
          court_officer: false,
          clerks: false,
          judge: false,
        }
      })) || [];
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "scheduled": return <Clock className="h-4 w-4 text-blue-600" />;
      case "in_progress": return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case "completed": return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "delayed": return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled": return "bg-blue-100 text-blue-800";
      case "in_progress": return "bg-orange-100 text-orange-800";
      case "completed": return "bg-green-100 text-green-800";
      case "delayed": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleNotificationUpdate = async (shutdownId: string, notificationType: keyof RoomShutdown['notifications_sent']) => {
    // This would update the notification status in the database
    toast({
      title: "Notification Updated",
      description: `${notificationType} notification marked as sent.`,
    });
    refetch();
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading room shutdown tracker...</div>;
  }

  const activeCount = shutdowns?.filter(s => s.status === "in_progress").length || 0;
  const scheduledCount = shutdowns?.filter(s => s.status === "scheduled").length || 0;
  const delayedCount = shutdowns?.filter(s => s.status === "delayed").length || 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Shutdowns</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{activeCount}</div>
            <p className="text-xs text-muted-foreground">Currently in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{scheduledCount}</div>
            <p className="text-xs text-muted-foreground">Upcoming shutdowns</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delayed</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{delayedCount}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <CalendarIcon className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {shutdowns?.filter(s => {
                const startDate = new Date(s.start_date);
                const now = new Date();
                const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                return startDate >= now && startDate <= weekFromNow;
              }).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Starting this week</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="delayed">Delayed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterReason} onValueChange={setFilterReason}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by reason" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Reasons</SelectItem>
            <SelectItem value="Modernization">Modernization</SelectItem>
            <SelectItem value="Maintenance">Maintenance</SelectItem>
            <SelectItem value="Cleaning">Cleaning</SelectItem>
            <SelectItem value="Emergency">Emergency</SelectItem>
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, "PPP") : "Filter by date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {(filterStatus !== "all" || filterReason !== "all" || selectedDate) && (
          <Button
            variant="ghost"
            onClick={() => {
              setFilterStatus("all");
              setFilterReason("all");
              setSelectedDate(undefined);
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Shutdown List */}
      <div className="grid gap-4">
        {shutdowns?.map((shutdown) => (
          <Card key={shutdown.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {getStatusIcon(shutdown.status)}
                    Room {shutdown.room_number} - {shutdown.reason}
                  </CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {shutdown.start_date && format(new Date(shutdown.start_date), "MMM dd")}
                      {shutdown.end_date && ` - ${format(new Date(shutdown.end_date), "MMM dd, yyyy")}`}
                    </div>
                  </div>
                </div>
                <Badge className={getStatusColor(shutdown.status)}>
                  {shutdown.status.replace("_", " ")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {shutdown.temporary_location && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-800 font-medium">
                      <MapPin className="h-4 w-4" />
                      Temporary Location
                    </div>
                    <p className="text-sm mt-1 text-blue-700">{shutdown.temporary_location}</p>
                  </div>
                )}

                {shutdown.project_notes && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="font-medium text-gray-800 mb-1">Project Notes</div>
                    <p className="text-sm text-gray-700">{shutdown.project_notes}</p>
                  </div>
                )}

                {/* Notification Checklist */}
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-800 font-medium mb-2">
                    <Bell className="h-4 w-4" />
                    Notification Checklist
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(shutdown.notifications_sent).map(([key, sent]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <Checkbox
                          id={`${shutdown.id}-${key}`}
                          checked={sent}
                          onCheckedChange={() => handleNotificationUpdate(shutdown.id, key as keyof RoomShutdown['notifications_sent'])}
                        />
                        <label htmlFor={`${shutdown.id}-${key}`} className="capitalize">
                          {key.replace("_", " ")} notified
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  {!shutdown.temporary_location && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onSetTemporaryLocation(shutdown.room_id)}
                    >
                      <MapPin className="h-4 w-4 mr-1" />
                      Set Temporary Location
                    </Button>
                  )}
                  <Button size="sm" variant="outline">
                    <Users className="h-4 w-4 mr-1" />
                    View Affected Sessions
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {shutdowns?.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No room shutdowns found
        </div>
      )}
    </div>
  );
};