import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO } from "date-fns";
import { Calendar as CalendarIcon, Clock, MapPin, AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export const MaintenanceCalendar = () => {
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<any | null>(null);

  const { data: schedules, isLoading } = useQuery({
    queryKey: ["maintenance-calendar"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_schedules")
        .select("*")
        .gte("scheduled_start_date", monthStart.toISOString())
        .lte("scheduled_start_date", monthEnd.toISOString())
        .order("scheduled_start_date", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const schedulesByDate = useMemo(() => {
    const map = new Map<string, any[]>();
    schedules?.forEach((schedule) => {
      const dateKey = format(parseISO(schedule.scheduled_start_date), "yyyy-MM-dd");
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)?.push(schedule);
    });
    return map;
  }, [schedules]);

  // Get schedules for selected date
  const selectedDateSchedules = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = format(selectedDate, "yyyy-MM-dd");
    return schedulesByDate.get(dateKey) || [];
  }, [selectedDate, schedulesByDate]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-500";
      case "high": return "bg-orange-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const getPriorityVariant = (priority: string): "destructive" | "default" | "secondary" | "outline" => {
    switch (priority) {
      case "urgent": return "destructive";
      case "high": return "destructive";
      case "medium": return "default";
      default: return "secondary";
    }
  };

  // Padding cells for weekday alignment
  const paddingDays = monthStart.getDay();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Maintenance Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Loading calendar...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {format(today, "MMMM yyyy")} - Maintenance Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Day headers */}
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
                {day}
              </div>
            ))}

            {/* Padding cells */}
            {Array.from({ length: paddingDays }).map((_, i) => (
              <div key={`pad-${i}`} className="min-h-[100px]" />
            ))}

            {/* Calendar days */}
            {daysInMonth.map((day) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const daySchedules = schedulesByDate.get(dateKey) || [];
              const isToday = isSameDay(day, today);
              const isSelected = selectedDate && isSameDay(day, selectedDate);

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => {
                    setSelectedDate(day);
                    setSelectedSchedule(null);
                  }}
                  className={`min-h-[100px] p-2 border rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-primary/10 border-primary ring-2 ring-primary/30"
                      : isToday
                        ? "bg-accent/50 border-accent-foreground/20"
                        : "bg-background hover:bg-muted/50"
                  } ${!isSameMonth(day, today) ? "opacity-50" : ""}`}
                >
                  <div className={`text-sm font-medium mb-1 ${
                    isSelected ? "text-primary" : isToday ? "text-accent-foreground font-bold" : ""
                  }`}>
                    {format(day, "d")}
                  </div>
                  <div className="space-y-1">
                    {daySchedules.slice(0, 2).map((schedule) => (
                      <div
                        key={schedule.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDate(day);
                          setSelectedSchedule(schedule);
                        }}
                        className="text-xs p-1 rounded bg-muted hover:bg-muted/80 cursor-pointer truncate"
                        title={schedule.title}
                      >
                        <div className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${getPriorityColor(schedule.priority)}`} />
                          <span className="truncate">{schedule.title}</span>
                        </div>
                      </div>
                    ))}
                    {daySchedules.length > 2 && (
                      <div className="text-xs text-muted-foreground">
                        +{daySchedules.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center gap-4 text-sm">
            <span className="font-medium">Priority:</span>
            {[
              { color: "bg-red-500", label: "Urgent" },
              { color: "bg-orange-500", label: "High" },
              { color: "bg-yellow-500", label: "Medium" },
              { color: "bg-green-500", label: "Low" },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1">
                <div className={`w-3 h-3 rounded-full ${color}`} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Detail Panel */}
      {selectedDate && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                {format(selectedDate, "EEEE, MMMM d, yyyy")}
                {selectedDateSchedules.length > 0 && (
                  <Badge variant="secondary">{selectedDateSchedules.length} task{selectedDateSchedules.length !== 1 ? "s" : ""}</Badge>
                )}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => { setSelectedDate(null); setSelectedSchedule(null); }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {selectedDateSchedules.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No maintenance scheduled for this day.</p>
            ) : (
              <div className="space-y-3">
                {selectedDateSchedules.map((schedule) => {
                  const isActive = selectedSchedule?.id === schedule.id;
                  return (
                    <div
                      key={schedule.id}
                      onClick={() => setSelectedSchedule(isActive ? null : schedule)}
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                        isActive ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${getPriorityColor(schedule.priority)}`} />
                          <span className="font-medium text-sm">{schedule.title}</span>
                        </div>
                        <Badge variant={getPriorityVariant(schedule.priority)} className="text-xs">
                          {schedule.priority}
                        </Badge>
                      </div>

                      {/* Expanded detail */}
                      {isActive && (
                        <div className="mt-3 space-y-2 text-sm border-t pt-3">
                          {schedule.description && (
                            <p className="text-muted-foreground">{schedule.description}</p>
                          )}
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <MapPin className="h-3.5 w-3.5" />
                              <span>{schedule.space_name || "No location"}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Clock className="h-3.5 w-3.5" />
                              <span>{format(parseISO(schedule.scheduled_start_date), "h:mm a")}</span>
                              {schedule.scheduled_end_date && (
                                <span>– {format(parseISO(schedule.scheduled_end_date), "h:mm a")}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              <span>Impact: {schedule.impact_level || "N/A"}</span>
                            </div>
                            <div>
                              <Badge variant="outline" className="text-xs">{schedule.status}</Badge>
                            </div>
                          </div>
                          {schedule.maintenance_type && (
                            <div className="text-xs text-muted-foreground">
                              Type: <span className="capitalize">{schedule.maintenance_type}</span>
                            </div>
                          )}
                          {schedule.notes && (
                            <div className="text-xs bg-muted rounded p-2 text-muted-foreground">
                              <strong>Notes:</strong> {schedule.notes}
                            </div>
                          )}
                          {schedule.special_instructions && (
                            <div className="text-xs bg-muted rounded p-2 text-muted-foreground">
                              <strong>Instructions:</strong> {schedule.special_instructions}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
