/**
 * AdminTasksPanel Component
 * 
 * Admin/Manager view for task oversight: approve requests, monitor active tasks, view completed work
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ClipboardList, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Plus,
  Loader2,
  InboxIcon
} from 'lucide-react';
import { useState } from 'react';
import { useStaffTasks } from '@/hooks/useStaffTasks';
import { TaskCard } from '@/components/tasks/TaskCard';
import { CreateTaskDialog } from '@/components/tasks/CreateTaskDialog';

export function AdminTasksPanel() {
  const [activeSubTab, setActiveSubTab] = useState('pending');
  
  // Fetch all tasks for admin view
  const { 
    tasks, 
    isLoading, 
    approveTask, 
    rejectTask,
    cancelTask,
  } = useStaffTasks();

  // Filter tasks by status
  const pendingTasks = tasks.filter(t => t.status === 'pending_approval');
  const activeTasks = tasks.filter(t => 
    ['approved', 'claimed', 'in_progress'].includes(t.status)
  );
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const rejectedTasks = tasks.filter(t => t.status === 'rejected');

  // Stats
  const stats = [
    { 
      label: 'Pending Approval', 
      value: pendingTasks.length, 
      icon: AlertCircle, 
      color: 'text-amber-500',
      bg: 'bg-amber-500/10'
    },
    { 
      label: 'Active', 
      value: activeTasks.length, 
      icon: Clock, 
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    { 
      label: 'Completed', 
      value: completedTasks.length, 
      icon: CheckCircle, 
      color: 'text-green-500',
      bg: 'bg-green-500/10'
    },
  ];

  const handleApprove = (taskId: string) => {
    approveTask.mutate({ taskId });
  };

  const handleReject = (taskId: string, reason: string) => {
    rejectTask.mutate({ taskId, reason });
  };

  const handleCancel = (taskId: string) => {
    cancelTask.mutate(taskId);
  };

  const renderEmptyState = (message: string) => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <InboxIcon className="h-12 w-12 text-muted-foreground/50 mb-3" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );

  const renderTaskList = (taskList: typeof tasks, emptyMessage: string) => {
    if (taskList.length === 0) {
      return renderEmptyState(emptyMessage);
    }

    return (
      <ScrollArea className="h-[500px]">
        <div className="space-y-3 pr-4">
          {taskList.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              showActions={true}
              onApprove={handleApprove}
              onReject={handleReject}
              onCancel={handleCancel}
              isLoading={approveTask.isPending || rejectTask.isPending}
            />
          ))}
        </div>
      </ScrollArea>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Task Management</h2>
        </div>
        <CreateTaskDialog
          trigger={
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Task
            </Button>
          }
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Task Tabs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">All Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="pending" className="gap-2">
                Pending
                {pendingTasks.length > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5">
                    {pendingTasks.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="active" className="gap-2">
                Active
                {activeTasks.length > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5">
                    {activeTasks.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              {renderTaskList(pendingTasks, 'No tasks pending approval')}
            </TabsContent>

            <TabsContent value="active">
              {renderTaskList(activeTasks, 'No active tasks')}
            </TabsContent>

            <TabsContent value="completed">
              {renderTaskList(completedTasks, 'No completed tasks yet')}
            </TabsContent>

            <TabsContent value="rejected">
              {renderTaskList(rejectedTasks, 'No rejected tasks')}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
