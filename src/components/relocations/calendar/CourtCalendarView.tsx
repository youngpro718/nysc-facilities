import { useState, useEffect } from "react";
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO } from "date-fns";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  Gavel, 
  Tool
} from "lucide-react";
import { useRelocations } from "../hooks/useRelocations";
import { RoomRelocation, WorkAssignment, CourtSession } from "../types/relocationTypes";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CalendarEvent {
  id: string;
  title: string;
  type: "court" | "work";
  date: string;
  startTime: string;
  endTime: string;
  status?: string;
  priority?: string;
  relocationId: string;
  roomName: string;
  color: string;
  icon: JSX.Element;
}

export function CourtCalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedRoom, setSelectedRoom] = useState<string>("all");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [view, setView] = useState<"day" | "week">("week");
  
  const { relocations, isLoading } = useRelocations();
  
  // Calculate the days to display based on the current view
  const daysToDisplay = view === "day" 
    ? [currentDate]
    : eachDayOfInterval({
        start: startOfWeek(currentDate, { weekStartsOn: 0 }),
        end: endOfWeek(currentDate, { weekStartsOn: 0 })
      });
  
  // Navigate to previous/next period
  const navigatePrevious = () => {
    setCurrentDate(prev => view === "day" ? addDays(prev, -1) : addDays(prev, -7));
  };
  
  const navigateNext = () => {
    setCurrentDate(prev => view === "day" ? addDays(prev, 1) : addDays(prev, 7));
  };
  
  const navigateToday = () => {
    setCurrentDate(new Date());
  };
  
  // Process relocations to extract events
  useEffect(() => {
    if (!relocations.length) return;
    
    const allEvents: CalendarEvent[] = [];
    
    relocations.forEach(relocation => {
      // Skip if filtering by room and this isn't the selected room
      if (selectedRoom !== "all" && relocation.id !== selectedRoom) {
        return;
      }
      
      // Add court sessions
      const courtSessions = relocation.metadata?.court_sessions || [];
      courtSessions.forEach((session: CourtSession) => {
        allEvents.push({
          id: session.id,
          title: `Court: ${session.session_type}${session.judge ? ` - Judge ${session.judge}` : ''}`,
          type: "court",
          date: session.date,
          startTime: session.start_time,
          endTime: session.end_time,
          relocationId: relocation.id,
          roomName: relocation.original_room?.name || "Unknown Room",
          color: "bg-red-500",
          icon: <Gavel className="h-3 w-3" />
        });
      });
      
      // Add work assignments
      const workAssignments = relocation.metadata?.work_assignments || [];
      workAssignments.forEach((assignment: WorkAssignment) => {
        let color = "bg-blue-500";
        if (assignment.status === "completed") {
          color = "bg-green-500";
        } else if (assignment.priority === "high") {
          color = "bg-amber-500";
        }
        
        allEvents.push({
          id: assignment.id,
          title: `Work: ${assignment.worker_name}`,
          type: "work",
          date: assignment.work_date,
          startTime: assignment.start_time,
          endTime: assignment.end_time,
          status: assignment.status,
          priority: assignment.priority,
          relocationId: relocation.id,
          roomName: relocation.temporary_room?.name || "Unknown Room",
          color,
          icon: <Tool className="h-3 w-3" />
        });
      });
    });
    
    setEvents(allEvents);
  }, [relocations, selectedRoom]);
  
  // Get all rooms for the filter
  const rooms = relocations.map(r => ({
    id: r.id,
    name: r.original_room?.name || "Unknown Room"
  }));
  
  // Filter events for the current view
  const getEventsForDay = (date: Date) => {
    const dateString = format(date, "yyyy-MM-dd");
    return events.filter(event => event.date === dateString);
  };
  
  // Format time for display
  const formatTimeRange = (startTime: string, endTime: string) => {
    // Convert 24-hour format to 12-hour format
    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}${minutes !== '00' ? ':' + minutes : ''} ${ampm}`;
    };
    
    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
  };
  
  // Check if there are conflicts between court sessions and work assignments
  const hasConflicts = (events: CalendarEvent[]) => {
    const courtEvents = events.filter(e => e.type === "court");
    const workEvents = events.filter(e => e.type === "work");
    
    for (const court of courtEvents) {
      for (const work of workEvents) {
        // Check if the time ranges overlap
        const courtStart = court.startTime;
        const courtEnd = court.endTime;
        const workStart = work.startTime;
        const workEnd = work.endTime;
        
        if (
          (workStart >= courtStart && workStart < courtEnd) ||
          (workEnd > courtStart && workEnd <= courtEnd) ||
          (workStart <= courtStart && workEnd >= courtEnd)
        ) {
          return true;
        }
      }
    }
    
    return false;
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>Courtroom Calendar</CardTitle>
            <CardDescription>
              View court sessions and work assignments
            </CardDescription>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={selectedRoom} onValueChange={setSelectedRoom}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by room" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Rooms</SelectItem>
                {rooms.map(room => (
                  <SelectItem key={room.id} value={room.id}>
                    {room.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex border rounded-md overflow-hidden">
              <Button 
                variant={view === "day" ? "default" : "ghost"}
                className="rounded-none flex-1"
                onClick={() => setView("day")}
              >
                Day
              </Button>
              <Button 
                variant={view === "week" ? "default" : "ghost"}
                className="rounded-none flex-1"
                onClick={() => setView("week")}
              >
                Week
              </Button>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-4">
          <Button variant="outline" size="sm" onClick={navigatePrevious}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            {view === "day" ? "Previous Day" : "Previous Week"}
          </Button>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={navigateToday}>
              Today
            </Button>
            <h3 className="text-lg font-semibold">
              {view === "day" 
                ? format(currentDate, "MMMM d, yyyy")
                : `${format(daysToDisplay[0], "MMM d")} - ${format(daysToDisplay[6], "MMM d, yyyy")}`
              }
            </h3>
          </div>
          
          <Button variant="outline" size="sm" onClick={navigateNext}>
            {view === "day" ? "Next Day" : "Next Week"}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
            {daysToDisplay.map((day, index) => {
              const dayEvents = getEventsForDay(day);
              const hasConflictingEvents = hasConflicts(dayEvents);
              
              return (
                <div 
                  key={index} 
                  className={`border rounded-md ${
                    isSameDay(day, new Date()) ? 'bg-muted/50 border-primary/50' : ''
                  } ${
                    view === "day" ? "col-span-full" : ""
                  }`}
                >
                  <div className={`p-2 border-b flex justify-between items-center ${
                    isSameDay(day, new Date()) ? 'bg-primary/10' : 'bg-muted/30'
                  }`}>
                    <span className="font-medium">{format(day, "EEE")}</span>
                    <span className="text-sm">{format(day, "MMM d")}</span>
                  </div>
                  
                  <div className="p-2 min-h-[150px]">
                    {hasConflictingEvents && (
                      <div className="mb-2 flex items-center gap-1 text-red-500 text-xs">
                        <AlertCircle className="h-3 w-3" />
                        <span>Scheduling conflict detected</span>
                      </div>
                    )}
                    
                    <ScrollArea className={`h-[${view === "day" ? "400px" : "150px"}]`}>
                      <div className="space-y-2">
                        {dayEvents.length === 0 ? (
                          <div className="text-xs text-muted-foreground text-center py-4">
                            No events scheduled
                          </div>
                        ) : (
                          dayEvents.map(event => (
                            <TooltipProvider key={event.id}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className={`${event.color} text-white p-2 rounded-md text-xs`}>
                                    <div className="flex justify-between items-center">
                                      <div className="flex items-center gap-1">
                                        {event.icon}
                                        <span className="font-medium truncate">{event.title}</span>
                                      </div>
                                      {event.status === "completed" && (
                                        <CheckCircle className="h-3 w-3" />
                                      )}
                                    </div>
                                    <div className="mt-1 flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      <span>{formatTimeRange(event.startTime, event.endTime)}</span>
                                    </div>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="space-y-1">
                                    <p className="font-medium">{event.title}</p>
                                    <p>Room: {event.roomName}</p>
                                    <p>Time: {formatTimeRange(event.startTime, event.endTime)}</p>
                                    {event.status && <p>Status: {event.status}</p>}
                                    {event.priority && <p>Priority: {event.priority}</p>}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        <div className="mt-4 flex flex-wrap gap-2">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-xs">Court Session</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-xs">Work Assignment</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span className="text-xs">High Priority Work</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-xs">Completed Work</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
