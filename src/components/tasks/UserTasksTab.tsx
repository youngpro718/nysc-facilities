// @ts-nocheck
/**
 * UserTasksTab Component
 * 
 * Tab content for My Activity page showing user's task requests
 */

import { Plus, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useStaffTasks } from '@/hooks/useStaffTasks';
import { RequestTaskDialog } from '@/components/tasks/RequestTaskDialog';
import { 
  TASK_TYPE_LABELS, 
  TASK_STATUS_LABELS, 
  TASK_STATUS_COLORS 
} from '@/types/staffTasks';
import type { StaffTask } from '@/types/staffTasks';

const statusIcons: Record<string, unknown> = {
  pending_approval: Clock,
  approved: CheckCircle,
  claimed: Loader2,
  in_progress: Loader2,
  completed: CheckCircle,
  cancelled: XCircle,
  rejected: XCircle,
};

export function UserTasksTab() {
  const { user } = useAuth();
  const { tasks, isLoading, cancelTask } = useStaffTasks({ userId: user?.id });

  // Separate active and past tasks
  const activeTasks = tasks.filter(t => 
    !['completed', 'cancelled', 'rejected'].includes(t.status)
  );
  const pastTasks = tasks.filter(t => 
    ['completed', 'cancelled', 'rejected'].includes(t.status)
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Task Requests</h2>
        <RequestTaskDialog />
      </div>

      {/* Active Tasks */}
      {activeTasks.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Active Requests</h3>
          {activeTasks.map((task) => (
            <TaskRequestCard 
              key={task.id} 
              task={task} 
              onCancel={task.status === 'pending_approval' ? () => cancelTask.mutate(task.id) : undefined}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {tasks.length === 0 && (
        <Card className="p-8 text-center">
          <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">No Task Requests</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Need help with something? Request a task and our team will assist you.
          </p>
          <RequestTaskDialog 
            trigger={
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Request a Task
              </Button>
            }
          />
        </Card>
      )}

      {/* Past Tasks */}
      {pastTasks.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Past Requests</h3>
          {pastTasks.slice(0, 10).map((task) => (
            <TaskRequestCard key={task.id} task={task} variant="compact" />
          ))}
        </div>
      )}
    </div>
  );
}

interface TaskRequestCardProps {
  task: StaffTask;
  variant?: 'default' | 'compact';
  onCancel?: () => void;
}

function TaskRequestCard({ task, variant = 'default', onCancel }: TaskRequestCardProps) {
  const StatusIcon = statusIcons[task.status] || Clock;
  const statusColor = TASK_STATUS_COLORS[task.status] || 'bg-gray-500';

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className={variant === 'compact' ? 'p-3' : 'p-4'}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-medium">{task.title}</h3>
              <Badge variant="outline" className="text-xs">
                {TASK_TYPE_LABELS[task.task_type]}
              </Badge>
            </div>
            
            {task.description && variant === 'default' && (
              <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                {task.description}
              </p>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={`${statusColor} text-white text-xs`}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {TASK_STATUS_LABELS[task.status]}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {format(new Date(task.created_at), 'MMM d, yyyy')}
              </span>
            </div>

            {task.rejection_reason && (
              <p className="text-xs text-destructive mt-2">
                Reason: {task.rejection_reason}
              </p>
            )}

            {task.completion_notes && (
              <p className="text-xs text-muted-foreground mt-2">
                Notes: {task.completion_notes}
              </p>
            )}
          </div>

          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
