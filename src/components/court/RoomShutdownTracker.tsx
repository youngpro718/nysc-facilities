import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Clock, MapPin, AlertTriangle, Calendar as CalendarIcon, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CreateShutdownDialog } from "./CreateShutdownDialog";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useRealtime } from "@/hooks/useRealtime";

type ShutdownReason = "Project" | "Maintenance" | "Cleaning" | "Emergency";

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
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedCourtroom, setSelectedCourtroom] = useState<{ id: string; room_number: string } | null>(null);

  // Enable real-time updates
  useRealtime({
    table: 'room_shutdowns',
    queryKeys: ['room-shutdowns'],
    showToasts: true
  });

  const { data: shutdowns, isLoading, refetch } = useQuery({
    queryKey: ["room-shutdowns", filterStatus, filterReason, selectedDate],
    queryFn: async () => {
      let query = supabase
        .from("room_shutdowns")
        .select(`
          id,
          reason,
          status,
          start_date,
          end_date,
          title,
          description,
          impact_level,
          temporary_location,
          court_rooms!inner(
            id,
            room_number
          ),
          shutdown_notifications(
            notification_type,
            sent_at
          )
        `)
        .order("start_date", { ascending: true });

      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus);
      }

      if (filterReason !== "all") {
        query = query.eq("reason", filterReason);
      }

      if (selectedDate) {
        const dateStr = selectedDate.toISOString().split('T')[0];
        query = query.gte("start_date", dateStr).lte("start_date", dateStr);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Transform the data to match our interface
      return data?.map(shutdown => ({
        id: shutdown.id,
        room_id: shutdown.court_rooms.id,
        room_number: shutdown.court_rooms.room_number,
        reason: shutdown.reason.charAt(0).toUpperCase() + shutdown.reason.slice(1) as ShutdownReason,
        start_date: shutdown.start_date,
        end_date: shutdown.end_date || "",
        temporary_location: shutdown.temporary_location || "",
        status: shutdown.status,
        project_notes: shutdown.description || "",
        notifications_sent: {
          major: shutdown.shutdown_notifications?.some(n => n.notification_type === 'one_week' && n.sent_at) || false,
          court_officer: shutdown.shutdown_notifications?.some(n => n.notification_type === 'three_days' && n.sent_at) || false,
          clerks: shutdown.shutdown_notifications?.some(n => n.notification_type === 'one_day' && n.sent_at) || false,
          judge: shutdown.shutdown_notifications?.some(n => n.notification_type === 'start' && n.sent_at) || false,
        }
      })) || [];
    },
  });

  // Get available courtrooms for creation
  const { data: courtrooms } = useQuery({
    queryKey: ["available-courtrooms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("court_rooms")
        .select("id, room_number")
        .eq("is_active", true)
        .order("room_number");
      
      if (error) throw error;
      return data || [];
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "scheduled": return <Clock className="h-4 w-4 text-primary" />;
      case "in_progress": return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case "completed": return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "delayed": return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled": return "bg-primary/10 text-primary";
      case "in_progress": return "bg-destructive/10 text-destructive";
      case "completed": return "bg-green-100 text-green-800";
      case "delayed": return "bg-destructive/10 text-destructive";
      default: return "bg-muted text-muted-foreground";
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
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{activeCount}</div>
            <p className="text-xs text-muted-foreground">Currently in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{scheduledCount}</div>
            <p className="text-xs text-muted-foreground">Upcoming shutdowns</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delayed</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{delayedCount}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <CalendarIcon className="h-4 w-4 text-accent-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent-foreground">
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

      {/* Filters and Actions */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
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
            <SelectItem value="Project">Project</SelectItem>
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

        <div className="flex gap-2">
          <Select onValueChange={(value) => {
            const courtroom = courtrooms?.find(c => c.id === value);
            if (courtroom) {
              setSelectedCourtroom(courtroom);
              setCreateDialogOpen(true);
            }
          }}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select room to schedule" />
            </SelectTrigger>
            <SelectContent>
              {courtrooms?.map((courtroom) => (
                <SelectItem key={courtroom.id} value={courtroom.id}>
                  Room {courtroom.room_number}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            onClick={() => setCreateDialogOpen(true)}
            disabled={!selectedCourtroom}
          >
            <Plus className="h-4 w-4 mr-2" />
            Schedule Shutdown
          </Button>
        </div>
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
                  <div className="bg-primary/5 p-3 rounded-lg border border-primary/20">
                    <div className="flex items-center gap-2 text-primary font-medium">
                      <MapPin className="h-4 w-4" />
                      Temporary Location
                    </div>
                    <p className="text-sm mt-1 text-foreground">{shutdown.temporary_location}</p>
                  </div>
                )}

                {shutdown.project_notes && (
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="font-medium text-foreground mb-1">Project Notes</div>
                    <p className="text-sm text-muted-foreground">{shutdown.project_notes}</p>
                  </div>
                )}



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

      {/* Create Shutdown Dialog */}
      {selectedCourtroom && (
        <CreateShutdownDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          courtroomId={selectedCourtroom.id}
          roomNumber={selectedCourtroom.room_number}
        />
      )}
    </div>
  );
};