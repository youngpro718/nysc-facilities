/**
 * StaffActivityPanel Component
 * 
 * Admin view showing court aide workloads, active tasks, and completion history.
 * Helps admins see who's doing what and track performance.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Loader2, User, CheckCircle, Clock, Play, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { TASK_TYPE_LABELS, TASK_PRIORITY_COLORS, TASK_STATUS_LABELS, TASK_STATUS_COLORS } from '@/types/staffTasks';
import type { TaskPriority, TaskType, TaskStatus } from '@/types/staffTasks';

interface StaffMember {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface StaffTaskSummary {
  staff: StaffMember;
  activeTasks: number;
  completedToday: number;
  completedTotal: number;
  tasks: {
    id: string;
    title: string;
    status: string;
    priority: string;
    task_type: string;
    due_date: string | null;
    claimed_at: string | null;
    completed_at: string | null;
    completion_notes: string | null;
  }[];
}

export function StaffActivityPanel() {
  const { data: staffActivity, isLoading } = useQuery({
    queryKey: ['staff-activity'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get all court aides (users with court_aide role)
      const { data: courtAides, error: aidesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .eq('is_approved', true);

      if (aidesError) throw aidesError;

      // Get all tasks that have been claimed or assigned
      const { data: allTasks, error: tasksError } = await supabase
        .from('staff_tasks')
        .select(`
          id,
          title,
          status,
          priority,
          task_type,
          due_date,
          claimed_by,
          assigned_to,
          claimed_at,
          completed_at,
          completion_notes
        `)
        .or('claimed_by.not.is.null,assigned_to.not.is.null')
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;

      // Build per-staff summaries
      const summaries: StaffTaskSummary[] = [];

      for (const aide of courtAides || []) {
        const aideTasks = (allTasks || []).filter(
          t => t.claimed_by === aide.id || t.assigned_to === aide.id
        );

        // Skip staff with no task history
        if (aideTasks.length === 0) continue;

        const activeTasks = aideTasks.filter(t =>
          ['claimed', 'in_progress'].includes(t.status)
        ).length;

        const completedToday = aideTasks.filter(t =>
          t.status === 'completed' &&
          t.completed_at &&
          new Date(t.completed_at) >= today
        ).length;

        const completedTotal = aideTasks.filter(t => t.status === 'completed').length;

        // Show recent tasks (active first, then recent completed, limit 10)
        const sortedTasks = [...aideTasks]
          .sort((a, b) => {
            // Active tasks first
            const aActive = ['claimed', 'in_progress'].includes(a.status) ? 0 : 1;
            const bActive = ['claimed', 'in_progress'].includes(b.status) ? 0 : 1;
            if (aActive !== bActive) return aActive - bActive;
            // Then by date
            return (b.completed_at || b.claimed_at || '').localeCompare(a.completed_at || a.claimed_at || '');
          })
          .slice(0, 10);

        summaries.push({
          staff: aide,
          activeTasks,
          completedToday,
          completedTotal,
          tasks: sortedTasks,
        });
      }

      // Sort: staff with active tasks first, then by total completed
      return summaries.sort((a, b) => {
        if (a.activeTasks !== b.activeTasks) return b.activeTasks - a.activeTasks;
        return b.completedTotal - a.completedTotal;
      });
    },
    staleTime: 30000,
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!staffActivity || staffActivity.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <User className="h-12 w-12 mx-auto mb-4 opacity-20" />
        <p className="font-medium">No staff activity yet</p>
        <p className="text-sm">Tasks claimed or assigned to staff will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{staffActivity.length}</p>
                <p className="text-xs text-muted-foreground">Active Staff</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Play className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {staffActivity.reduce((sum, s) => sum + s.activeTasks, 0)}
                </p>
                <p className="text-xs text-muted-foreground">Tasks In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {staffActivity.reduce((sum, s) => sum + s.completedToday, 0)}
                </p>
                <p className="text-xs text-muted-foreground">Completed Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <TrendingUp className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {staffActivity.reduce((sum, s) => sum + s.completedTotal, 0)}
                </p>
                <p className="text-xs text-muted-foreground">Total Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Staff Accordion */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Workload & History</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {staffActivity.map((entry) => (
              <AccordionItem key={entry.staff.id} value={entry.staff.id}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold">
                          {entry.staff.first_name} {entry.staff.last_name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {entry.staff.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {entry.activeTasks > 0 && (
                        <Badge className="bg-blue-500 text-white">
                          {entry.activeTasks} active
                        </Badge>
                      )}
                      <Badge variant="outline">
                        {entry.completedToday} today
                      </Badge>
                      <Badge variant="secondary">
                        {entry.completedTotal} total
                      </Badge>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ScrollArea className="max-h-[300px]">
                    <div className="space-y-2 pt-2">
                      {entry.tasks.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No task history
                        </p>
                      ) : (
                        entry.tasks.map((task) => {
                          const isActive = ['claimed', 'in_progress'].includes(task.status);
                          return (
                            <div
                              key={task.id}
                              className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                                isActive
                                  ? 'bg-primary/5 border-primary/20'
                                  : 'bg-card border-border'
                              }`}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-sm truncate">{task.title}</span>
                                  <Badge
                                    className={`text-xs ${TASK_STATUS_COLORS[task.status as TaskStatus] || 'bg-gray-500'} text-white`}
                                  >
                                    {TASK_STATUS_LABELS[task.status as TaskStatus] || task.status}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                                  <Badge variant="outline" className="text-xs">
                                    {TASK_TYPE_LABELS[task.task_type as TaskType] || task.task_type}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className={`text-xs border-0 ${TASK_PRIORITY_COLORS[task.priority as TaskPriority] || 'bg-gray-500'} text-white`}
                                  >
                                    {task.priority}
                                  </Badge>
                                  {task.claimed_at && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      Claimed {format(new Date(task.claimed_at), 'MMM d, h:mm a')}
                                    </span>
                                  )}
                                  {task.completed_at && (
                                    <span className="flex items-center gap-1">
                                      <CheckCircle className="h-3 w-3 text-green-500" />
                                      Done {format(new Date(task.completed_at), 'MMM d, h:mm a')}
                                    </span>
                                  )}
                                </div>
                                {task.completion_notes && (
                                  <p className="text-xs text-muted-foreground mt-1 italic">
                                    "{task.completion_notes}"
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
