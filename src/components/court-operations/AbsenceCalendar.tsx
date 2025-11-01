import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Download } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isWithinInterval, addMonths, subMonths } from "date-fns";

interface StaffAbsence {
  id: string;
  staff_id: string;
  kind: string;
  absence_reason: string | null;
  starts_on: string;
  ends_on: string;
  coverage_assigned: boolean | null;
  notes: string | null;
  staff?: {
    display_name: string;
    role: string;
  };
  covering_staff?: {
    display_name: string;
  };
}

export function AbsenceCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Fetch absences for the current month
  const { data: absences = [], isLoading } = useQuery({
    queryKey: ["absence-calendar", format(currentMonth, "yyyy-MM")],
    queryFn: async () => {
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);

      const { data, error } = await supabase
        .from("staff_absences")
        .select(`
          *,
          staff:staff_id (
            display_name,
            role
          ),
          covering_staff:covering_staff_id (
            display_name
          )
        `)
        .or(`starts_on.lte.${format(monthEnd, "yyyy-MM-dd")},ends_on.gte.${format(monthStart, "yyyy-MM-dd")}`);

      if (error) throw error;
      return data as StaffAbsence[];
    },
  });

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    
    // Get all days in the month
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Add padding days to start on Sunday
    const firstDayOfWeek = monthStart.getDay();
    const paddingDays = Array(firstDayOfWeek).fill(null);
    
    return [...paddingDays, ...daysInMonth];
  }, [currentMonth]);

  // Get absences for a specific day
  const getAbsencesForDay = (day: Date | null) => {
    if (!day) return [];
    
    return absences.filter(absence => {
      const start = new Date(absence.starts_on);
      const end = new Date(absence.ends_on);
      return isWithinInterval(day, { start, end });
    });
  };

  // Get color for absence type
  const getAbsenceColor = (kind: string) => {
    const colors: Record<string, string> = {
      sick: "bg-red-500/20 text-red-300 border-red-500/30",
      vacation: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      emergency: "bg-orange-500/20 text-orange-300 border-orange-500/30",
      personal: "bg-purple-500/20 text-purple-300 border-purple-500/30",
      training: "bg-green-500/20 text-green-300 border-green-500/30",
      other: "bg-gray-500/20 text-gray-300 border-gray-500/30",
    };
    return colors[kind] || colors.other;
  };

  const previousMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
  const nextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));
  const today = () => setCurrentMonth(new Date());

  const exportCalendar = () => {
    // Create iCal format
    const icalData = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//NYSC Facilities//Staff Absences//EN",
      "CALSCALE:GREGORIAN",
      ...absences.map(absence => [
        "BEGIN:VEVENT",
        `UID:${absence.id}@nysc-facilities.com`,
        `DTSTART:${format(new Date(absence.starts_on), "yyyyMMdd")}`,
        `DTEND:${format(new Date(absence.ends_on), "yyyyMMdd")}`,
        `SUMMARY:${absence.staff?.display_name} - ${absence.kind}`,
        `DESCRIPTION:${absence.notes || "No notes"}`,
        "END:VEVENT"
      ]).flat(),
      "END:VCALENDAR"
    ].join("\r\n");

    const blob = new Blob([icalData], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `staff-absences-${format(currentMonth, "yyyy-MM")}.ics`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Staff Absence Calendar
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={today}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={exportCalendar}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" size="sm" onClick={previousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-lg font-semibold">
            {format(currentMonth, "MMMM yyyy")}
          </h3>
          <Button variant="outline" size="sm" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Day Headers */}
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
            <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
              {day}
            </div>
          ))}

          {/* Calendar Days */}
          {calendarDays.map((day, index) => {
            const dayAbsences = day ? getAbsencesForDay(day) : [];
            const isToday = day ? isSameDay(day, new Date()) : false;
            const isCurrentMonth = day ? isSameMonth(day, currentMonth) : false;

            return (
              <div
                key={index}
                className={`
                  min-h-[100px] p-2 border rounded-lg
                  ${!day ? "bg-muted/50" : ""}
                  ${isToday ? "border-blue-500 bg-blue-500/5" : "border-border"}
                  ${!isCurrentMonth ? "opacity-50" : ""}
                `}
              >
                {day && (
                  <>
                    <div className={`text-sm font-medium mb-1 ${isToday ? "text-blue-500" : ""}`}>
                      {format(day, "d")}
                    </div>
                    <div className="space-y-1">
                      {dayAbsences.slice(0, 3).map(absence => (
                        <div
                          key={absence.id}
                          className={`text-xs p-1 rounded border ${getAbsenceColor(absence.kind)}`}
                          title={`${absence.staff?.display_name} - ${absence.kind}${absence.coverage_assigned ? " (Covered)" : ""}`}
                        >
                          <div className="font-medium truncate">
                            {absence.staff?.display_name}
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-[10px] px-1 py-0">
                              {absence.staff?.role}
                            </Badge>
                            {absence.coverage_assigned && (
                              <span className="text-[10px]">✓</span>
                            )}
                          </div>
                        </div>
                      ))}
                      {dayAbsences.length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          +{dayAbsences.length - 3} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500/20 border border-red-500/30" />
            <span className="text-sm">Sick</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500/20 border border-blue-500/30" />
            <span className="text-sm">Vacation</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-orange-500/20 border border-orange-500/30" />
            <span className="text-sm">Emergency</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-purple-500/20 border border-purple-500/30" />
            <span className="text-sm">Personal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500/20 border border-green-500/30" />
            <span className="text-sm">Training</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">✓ = Coverage Assigned</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
