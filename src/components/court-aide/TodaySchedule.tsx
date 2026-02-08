/**
 * TodaySchedule Component
 * 
 * Shows admin-assigned tasks with expected time windows for the current user.
 * Displays today's tasks and upcoming work (next 7 days).
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Calendar, Clock, MapPin, User } from 'lucide-react';
import { format, parseISO, startOfDay, endOfDay, addDays, isToday } from 'date-fns';
import { TASK_PRIORITY_COLORS, TASK_TYPE_LABELS } from '@/types/staffTasks';
import type { TaskPriority, TaskType } from '@/types/staffTasks';

interface ScheduledTask {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  task_type: string;
  due_date: string | null;
  status: string;
  location: string | null;
  assigned_by: string | null;
}

export function TodaySchedule() {
  const { user } = useAuth();
  const today = new Date();

  const { data: scheduledTasks, isLoading } = useQuery({
    queryKey: ['today-schedule', format(today, 'yyyy-MM-dd'), user?.id],
    queryFn: async () => {
      const startOfToday = startOfDay(today).toISOString();
      const endOfWeek = endOfDay(addDays(today, 7)).toISOString();

      // Fetch tasks assigned to or claimed by the current user with due dates today through next 7 days
      const { data: tasks, error } = await supabase
        .from('staff_tasks')
        .select(`
          id,
          title,
          description,
          priority,
          task_type,
          due_date,
          status,
          to_room:rooms!staff_tasks_to_room_id_fkey(room_number, name),
          creator:profiles!staff_tasks_created_by_fkey(first_name, last_name)
        `)
        .or(`assigned_to.eq.${user?.id},claimed_by.eq.${user?.id}`)
        .not('status', 'in', '("completed","cancelled","rejected")')
        .not('due_date', 'is', null)
        .gte('due_date', startOfToday)
        .lte('due_date', endOfWeek)
        .order('due_date', { ascending: true });

      if (error) throw error;

      return (tasks || []).map((task) => {
        const toRoom = task.to_room as { room_number?: string; name?: string } | null;
        const creator = task.creator as { first_name?: string; last_name?: string } | null;
        return {
          id: task.id,
          title: task.title,
          description: task.description,
          priority: task.priority,
          task_type: task.task_type,
          due_date: task.due_date,
          status: task.status,
          location: toRoom?.room_number 
            ? `${toRoom.name ? toRoom.name + ' ' : ''}(${toRoom.room_number})`
            : null,
          assigned_by: creator 
            ? `${creator.first_name || ''} ${creator.last_name || ''}`.trim() 
            : null,
        } as ScheduledTask;
      });
    },
    enabled: !!user?.id,
    refetchInterval: 60000,
  });

  const todayTasks = scheduledTasks?.filter(t => t.due_date && isToday(parseISO(t.due_date))) || [];
  const upcomingTasks = scheduledTasks?.filter(t => t.due_date && !isToday(parseISO(t.due_date))) || [];

  const renderTask = (task: ScheduledTask) => {
    const dueTime = task.due_date ? format(parseISO(task.due_date), 'h:mm a') : null;
    const dueDay = task.due_date && !isToday(parseISO(task.due_date))
      ? format(parseISO(task.due_date), 'EEE, MMM d')
      : null;

    return (
      <div 
        key={task.id}
        className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
      >
        {/* Time Column */}
        <div className="w-16 shrink-0 text-right pt-0.5">
          {dueTime ? (
            <div>
              <span className="text-sm font-medium text-primary">{dueTime}</span>
              {dueDay && (
                <p className="text-[10px] text-muted-foreground">{dueDay}</p>
              )}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">No time</span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm truncate">{task.title}</span>
            <Badge 
              className={`text-xs shrink-0 ${TASK_PRIORITY_COLORS[task.priority as TaskPriority] || 'bg-muted'} text-white`}
            >
              {task.priority}
            </Badge>
          </div>
          <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
            <Badge variant="outline" className="text-xs">
              {TASK_TYPE_LABELS[task.task_type as TaskType] || task.task_type}
            </Badge>
            {task.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {task.location}
              </span>
            )}
            {task.assigned_by && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {task.assigned_by}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Schedule
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
        ) : (!scheduledTasks || scheduledTasks.length === 0) ? (
          <div className="text-center py-6 text-muted-foreground">
            <Calendar className="h-10 w-10 mx-auto mb-2 opacity-20" />
            <p className="text-sm">No scheduled tasks</p>
            <p className="text-xs mt-1">Tasks with due dates assigned to you will appear here</p>
          </div>
        ) : (
          <ScrollArea className="h-[280px]">
            <div className="space-y-4">
              {/* Today's Tasks */}
              {todayTasks.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <h4 className="text-sm font-medium">Today</h4>
                    <Badge variant="secondary" className="text-xs">{todayTasks.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {todayTasks.map(renderTask)}
                  </div>
                </div>
              )}

              {/* Upcoming Tasks */}
              {upcomingTasks.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <h4 className="text-sm font-medium text-muted-foreground">Upcoming</h4>
                    <Badge variant="outline" className="text-xs">{upcomingTasks.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {upcomingTasks.map(renderTask)}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
