
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";

// Define the proper type for the DayContent props
interface DayContentProps {
  date: Date;
  activeMonth?: Date;
  selected?: boolean;
  disabled?: boolean;
}

export function MaintenanceScheduleCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  // Fetch maintenance events for calendar highlighting
  const { data: maintenanceEvents } = useQuery({
    queryKey: ['maintenance-calendar-events'],
    queryFn: async () => {
      // This would typically fetch from your maintenance schedules table
      const { data, error } = await supabase
        .from('lighting_maintenance_schedules')
        .select('*')
        .gte('scheduled_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
        .lte('scheduled_date', new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString());
        
      if (error) throw error;
      
      // Transform to a format usable by the calendar
      const events = new Map();
      data?.forEach(event => {
        const eventDate = new Date(event.scheduled_date).toDateString();
        if (events.has(eventDate)) {
          events.get(eventDate).count += 1;
          
          // Add priority info
          if (event.priority_level === 'high') {
            events.get(eventDate).hasHighPriority = true;
          }
        } else {
          events.set(eventDate, { 
            count: 1, 
            hasHighPriority: event.priority_level === 'high' 
          });
        }
      });
      
      return events;
    }
  });
  
  // Query for selected day's maintenance tasks
  const { data: selectedDateTasks, isLoading } = useQuery({
    queryKey: ['maintenance-day-tasks', date?.toDateString()],
    queryFn: async () => {
      if (!date) return [];
      
      // Format date for comparison (start and end of day)
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const { data, error } = await supabase
        .from('lighting_maintenance_schedules')
        .select(`
          id, 
          maintenance_type, 
          scheduled_date, 
          status,
          priority_level,
          fixture_id,
          lighting_fixtures(name)
        `)
        .gte('scheduled_date', startOfDay.toISOString())
        .lte('scheduled_date', endOfDay.toISOString())
        .order('scheduled_date', { ascending: true });
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!date
  });
  
  // Function to render custom day contents for the calendar
  const getDayClass = (day: Date) => {
    if (!day || !maintenanceEvents) return "";
    
    const dayString = day.toDateString();
    const hasEvents = maintenanceEvents.has(dayString);
    
    if (!hasEvents) return "";
    
    const events = maintenanceEvents.get(dayString);
    if (events?.hasHighPriority) {
      return "bg-red-100 dark:bg-red-900/30 text-red-800";
    }
    
    return events?.count > 2 ? "bg-amber-100 dark:bg-amber-900/30 text-amber-800" : "bg-blue-100 dark:bg-blue-900/30 text-blue-800";
  };
  
  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-md border pointer-events-auto"
          modifiersClassNames={{
            selected: "bg-primary text-primary-foreground",
          }}
          modifiers={{
            booked: (day) => {
              return maintenanceEvents?.has(day?.toDateString() || "") || false;
            }
          }}
          modifiersStyles={{
            booked: { border: '2px solid var(--primary)' },
          }}
          components={{
            DayContent: ({ date: dayDate }: DayContentProps) => {
              if (!dayDate) return null;
              
              const dayString = dayDate.toDateString();
              const dayClass = getDayClass(dayDate);
              const events = maintenanceEvents?.get(dayString);
              
              return (
                <div className="relative w-full h-full flex items-center justify-center">
                  {dayDate.getDate()}
                  {events?.count > 0 && (
                    <span className={`absolute bottom-1 right-1 w-2 h-2 rounded-full ${events?.hasHighPriority ? 'bg-red-500' : 'bg-blue-500'}`} />
                  )}
                </div>
              );
            }
          }}
        />
      </div>
      
      <Card className="flex-1">
        <CardContent className="pt-6">
          <h3 className="font-medium text-lg mb-3">
            {date ? format(date, "MMMM d, yyyy") : "No date selected"}
          </h3>
          
          {isLoading ? (
            <p className="text-muted-foreground">Loading tasks...</p>
          ) : selectedDateTasks?.length === 0 ? (
            <p className="text-muted-foreground">No maintenance scheduled for this day.</p>
          ) : (
            <div className="space-y-3">
              {selectedDateTasks?.map((task) => (
                <div key={task.id} className="flex items-start gap-2 p-2 hover:bg-muted/50 rounded-md">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{(task.lighting_fixtures as any)?.name || 'Unknown Fixture'}</span>
                      <Badge variant={task.priority_level === 'high' ? 'destructive' : task.priority_level === 'medium' ? 'default' : 'secondary'}>
                        {task.priority_level}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{task.maintenance_type}</p>
                    <p className="text-xs">{format(new Date(task.scheduled_date), "h:mm a")}</p>
                  </div>
                  <Badge variant={
                    task.status === 'completed' ? 'outline' : 
                    task.status === 'in_progress' ? 'default' : 'secondary'
                  }>
                    {task.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
