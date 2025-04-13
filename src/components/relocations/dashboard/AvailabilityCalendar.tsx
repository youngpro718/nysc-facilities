import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { DailyAvailability, TimeSlot, WorkAssignment, CourtSession } from "../types/relocationTypes";
import { format, isToday, isThisWeek, parseISO } from "date-fns";
import { Calendar, Clock, AlertCircle, CheckCircle, Hammer, Gavel } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AvailabilityCalendarProps {
  availability: DailyAvailability[];
  onAddWorkAssignment?: (date: string, timeSlot: TimeSlot) => void;
  onViewWorkAssignment?: (workAssignment: WorkAssignment) => void;
  onViewCourtSession?: (courtSession: CourtSession) => void;
}

export function AvailabilityCalendar({
  availability,
  onAddWorkAssignment,
  onViewWorkAssignment,
  onViewCourtSession
}: AvailabilityCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(
    availability.length > 0 ? availability[0].date : null
  );

  // Filter availability for the selected date
  const selectedDayAvailability = selectedDate
    ? availability.find(day => day.date === selectedDate)
    : null;

  // Get all unique dates from the availability data
  const uniqueDates = Array.from(new Set(availability.map(day => day.date)));

  // Get room info
  const roomId = availability.length > 0 ? availability[0].room_id : "";

  // Render the calendar view
  return (
    <div className="space-y-4">
      {/* Date selector */}
      <div className="flex flex-wrap gap-2">
        {uniqueDates.map(date => {
          const isSelected = date === selectedDate;
          const dayAvailability = availability.find(day => day.date === date);
          
          // Determine date badge style based on availability and current time
          let badgeVariant = "outline";
          if (isSelected) badgeVariant = "default";
          if (dayAvailability?.is_available) badgeVariant = "secondary";
          if (isToday(parseISO(date))) badgeVariant = "default";
          
          return (
            <Button
              key={date}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedDate(date)}
              className={isSelected ? "pointer-events-none" : ""}
            >
              {format(parseISO(date), "MMM d")}
              {dayAvailability?.is_available && (
                <div className="ml-1.5 w-2 h-2 rounded-full bg-green-500" />
              )}
            </Button>
          );
        })}
      </div>
      
      {selectedDayAvailability ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {format(parseISO(selectedDayAvailability.date), "EEEE, MMMM d, yyyy")}
            </CardTitle>
            <CardDescription>
              {selectedDayAvailability.is_available 
                ? `${selectedDayAvailability.available_slots.length} available time slots`
                : "No available time slots"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Time slots section */}
              <div>
                <h3 className="font-medium mb-2">Time Slots</h3>
                <ScrollArea className="h-[200px] w-full rounded-md border p-2">
                  <div className="space-y-2">
                    {/* Available slots */}
                    {selectedDayAvailability.available_slots.length > 0 ? (
                      selectedDayAvailability.available_slots.map((slot, index) => (
                        <div
                          key={`${slot.start_time}-${slot.end_time}`}
                          className="p-2 border rounded-md flex justify-between items-center bg-green-50 dark:bg-green-950"
                        >
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>
                              {slot.start_time} - {slot.end_time}
                            </span>
                          </div>
                          {onAddWorkAssignment && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onAddWorkAssignment(selectedDayAvailability.date, slot)}
                            >
                              Add Work
                            </Button>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center p-4 text-muted-foreground">
                        No available time slots on this date.
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
              
              {/* Court sessions section */}
              {selectedDayAvailability.court_sessions.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Court Sessions</h3>
                  <ScrollArea className="h-[120px] w-full rounded-md border p-2">
                    <div className="space-y-2">
                      {selectedDayAvailability.court_sessions.map(session => (
                        <TooltipProvider key={session.id}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div 
                                className="p-2 border rounded-md flex justify-between items-center bg-red-50 dark:bg-red-950 cursor-pointer"
                                onClick={() => onViewCourtSession?.(session)}
                              >
                                <div className="flex items-center gap-2">
                                  <Gavel className="h-4 w-4 text-red-500" />
                                  <span>
                                    {session.start_time} - {session.end_time}
                                  </span>
                                  <Badge variant="outline" className="ml-2">
                                    {session.status}
                                  </Badge>
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{session.description || "Court in Session"}</p>
                              {session.judge_name && <p>Judge: {session.judge_name}</p>}
                              {session.case_number && <p>Case: {session.case_number}</p>}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
              
              {/* Work assignments section */}
              {selectedDayAvailability.work_assignments.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Work Assignments</h3>
                  <ScrollArea className="h-[120px] w-full rounded-md border p-2">
                    <div className="space-y-2">
                      {selectedDayAvailability.work_assignments.map(assignment => (
                        <TooltipProvider key={assignment.id}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div 
                                className="p-2 border rounded-md flex justify-between items-center bg-blue-50 dark:bg-blue-950 cursor-pointer"
                                onClick={() => onViewWorkAssignment?.(assignment)}
                              >
                                <div className="flex items-center gap-2">
                                  <Hammer className="h-4 w-4 text-blue-500" />
                                  <span>
                                    {assignment.start_time} - {assignment.end_time}
                                  </span>
                                  <Badge variant={assignment.status === 'completed' ? 'default' : 'outline'} className="ml-2">
                                    {assignment.status}
                                  </Badge>
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p><strong>{assignment.task}</strong></p>
                              <p>Crew: {assignment.crew_name}</p>
                              {assignment.notes && <p>Notes: {assignment.notes}</p>}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex-col items-start gap-2">
            <div className="text-sm text-muted-foreground">
              <div className="flex items-center gap-1 mb-1">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>Available for work</span>
              </div>
              <div className="flex items-center gap-1 mb-1">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span>Court session</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span>Work assignment</span>
              </div>
            </div>
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Date Selected</CardTitle>
            <CardDescription>
              Please select a date to view availability details.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
