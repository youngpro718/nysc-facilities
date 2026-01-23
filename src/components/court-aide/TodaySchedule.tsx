/**
 * TodaySchedule Component
 * 
 * Shows scheduled tasks and events for the current day
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Calendar, Clock, MapPin, AlertTriangle } from 'lucide-react';
import { format, isToday, isTomorrow, parseISO, startOfDay, endOfDay } from 'date-fns';
import { TASK_PRIORITY_COLORS, TASK_TYPE_LABELS } from '@/types/staffTasks';

interface ScheduledItem {
  id: string;
  type: 'task' | 'maintenance';
  title: string;
  description?: string | null;
  priority?: string;
  task_type?: string;
  due_date?: string | null;
  scheduled_date?: string | null;
  location?: string | null;
  status: string;
}

export function TodaySchedule() {
  const today = new Date();

  const { data: scheduledItems, isLoading } = useQuery({
    queryKey: ['today-schedule', format(today, 'yyyy-MM-dd')],
    queryFn: async () => {
      const startOfToday = startOfDay(today).toISOString();
      const endOfToday = endOfDay(today).toISOString();
      const items: ScheduledItem[] = [];

      // Fetch tasks with due dates today
      const { data: tasks, error: tasksError } = await supabase
        .from('staff_tasks')
        .select(`
          id,
          title,
          description,
          priority,
          task_type,
          due_date,
          status,
          to_room:rooms!staff_tasks_to_room_id_fkey(room_number)
        `)
        .gte('due_date', startOfToday)
        .lte('due_date', endOfToday)
        .not('status', 'in', '("completed","cancelled","rejected")');

      if (!tasksError && tasks) {
        tasks.forEach((task: any) => {
          items.push({
            id: task.id,
            type: 'task',
            title: task.title,
            description: task.description,
            priority: task.priority,
            task_type: task.task_type,
            due_date: task.due_date,
            location: task.to_room?.room_number ? `Room ${task.to_room.room_number}` : null,
            status: task.status,
          });
        });
      }

      // Fetch scheduled maintenance for today
      const { data: maintenance, error: maintError } = await supabase
        .from('maintenance_schedules')
        .select('*')
        .gte('scheduled_start_date', startOfToday)
        .lte('scheduled_start_date', endOfToday)
        .neq('status', 'completed');

      if (!maintError && maintenance) {
        maintenance.forEach((maint: any) => {
          items.push({
            id: maint.id,
            type: 'maintenance',
            title: maint.title || 'Scheduled Maintenance',
            description: maint.description,
            scheduled_date: maint.scheduled_start_date,
            location: maint.location,
            status: maint.status,
          });
        });
      }

      // Sort by time
      return items.sort((a, b) => {
        const dateA = a.due_date || a.scheduled_date || '';
        const dateB = b.due_date || b.scheduled_date || '';
        return dateA.localeCompare(dateB);
      });
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const getTimeDisplay = (dateStr: string | null | undefined) => {
    if (!dateStr) return null;
    const date = parseISO(dateStr);
    return format(date, 'h:mm a');
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Today's Schedule
          </CardTitle>
          <Badge variant="outline">
            {format(today, 'EEE, MMM d')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !scheduledItems || scheduledItems.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Calendar className="h-10 w-10 mx-auto mb-2 opacity-20" />
            <p className="text-sm">No scheduled items for today</p>
          </div>
        ) : (
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {scheduledItems.map((item) => (
                <div 
                  key={item.id}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  {/* Time Column */}
                  <div className="w-16 shrink-0 text-right">
                    {(item.due_date || item.scheduled_date) ? (
                      <span className="text-sm font-medium text-primary">
                        {getTimeDisplay(item.due_date || item.scheduled_date)}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">No time</span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-sm truncate">{item.title}</span>
                      {item.priority && (
                        <Badge 
                          className={`text-xs ${TASK_PRIORITY_COLORS[item.priority as keyof typeof TASK_PRIORITY_COLORS] || 'bg-muted'} text-white`}
                        >
                          {item.priority}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {item.type === 'task' && item.task_type && (
                        <Badge variant="outline" className="text-xs">
                          {TASK_TYPE_LABELS[item.task_type as keyof typeof TASK_TYPE_LABELS] || item.task_type}
                        </Badge>
                      )}
                      {item.type === 'maintenance' && (
                        <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-600">
                          Maintenance
                        </Badge>
                      )}
                      {item.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {item.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
