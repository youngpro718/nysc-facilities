/**
 * StaffTasksPanel Component
 * 
 * Admin view for managing all staff tasks
 * - View pending task requests
 * - Approve/reject requests
 * - Create direct tasks
 * - View task history
 */

import { useState } from 'react';
import { 
  ClipboardList, 
  Clock, 
  CheckCircle, 
  Users,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useStaffTasks } from '@/hooks/useStaffTasks';
import { TaskCard } from '@/components/tasks/TaskCard';
import { CreateTaskDialog } from '@/components/tasks/CreateTaskDialog';

export function StaffTasksPanel() {
  const [activeTab, setActiveTab] = useState('pending');
  
  // Fetch different task sets
  const { 
    tasks: pendingTasks, 
    isLoading: pendingLoading,
    refetch: refetchPending,
    approveTask,
    rejectTask,
  } = useStaffTasks({ status: 'pending_approval', onlyRequests: true });

  const { 
    tasks: activeTasks, 
    isLoading: activeLoading,
    refetch: refetchActive,
    cancelTask,
  } = useStaffTasks({ status: ['approved', 'claimed', 'in_progress'] });

  const { 
    tasks: completedTasks, 
    isLoading: completedLoading,
    refetch: refetchCompleted,
  } = useStaffTasks({ status: 'completed' });

  const handleRefresh = () => {
    refetchPending();
    refetchActive();
    refetchCompleted();
  };

  const handleApprove = async (taskId: string) => {
    await approveTask.mutateAsync({ taskId });
  };

  const handleReject = async (taskId: string, reason: string) => {
    await rejectTask.mutateAsync({ taskId, reason });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="h-6 w-6" />
            Staff Tasks
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage task requests and assignments
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <CreateTaskDialog />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Clock className="h-5 w-5 text-yellow-600" />
              <Badge variant={pendingTasks.length > 0 ? "destructive" : "secondary"}>
                {pendingTasks.length}
              </Badge>
            </div>
            <p className="text-sm font-medium mt-2">Pending Approval</p>
            <p className="text-xs text-muted-foreground">Requests awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Users className="h-5 w-5 text-blue-600" />
              <Badge variant="outline">
                {activeTasks.filter(t => t.status === 'approved').length}
              </Badge>
            </div>
            <p className="text-sm font-medium mt-2">Available</p>
            <p className="text-xs text-muted-foreground">Ready for staff to claim</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <AlertCircle className="h-5 w-5 text-purple-600" />
              <Badge variant="outline">
                {activeTasks.filter(t => t.status === 'in_progress' || t.status === 'claimed').length}
              </Badge>
            </div>
            <p className="text-sm font-medium mt-2">In Progress</p>
            <p className="text-xs text-muted-foreground">Currently being worked on</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <Badge variant="outline">
                {completedTasks.length}
              </Badge>
            </div>
            <p className="text-sm font-medium mt-2">Completed</p>
            <p className="text-xs text-muted-foreground">Finished tasks</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending" className="relative">
            Pending Approval
            {pendingTasks.length > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] text-destructive-foreground flex items-center justify-center">
                {pendingTasks.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="active">Active Tasks</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {pendingLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
            </div>
          ) : pendingTasks.length === 0 ? (
            <Card className="p-8 text-center">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <h3 className="font-semibold mb-2">No Pending Requests</h3>
              <p className="text-sm text-muted-foreground">
                All task requests have been reviewed.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {pendingTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  isLoading={approveTask.isPending || rejectTask.isPending}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active" className="mt-4">
          {activeLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
            </div>
          ) : activeTasks.length === 0 ? (
            <Card className="p-8 text-center">
              <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No Active Tasks</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create a task to get started.
              </p>
              <CreateTaskDialog />
            </Card>
          ) : (
            <div className="space-y-3">
              {activeTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  showActions={false}
                  onCancel={(id) => cancelTask.mutate(id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          {completedLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
            </div>
          ) : completedTasks.length === 0 ? (
            <Card className="p-8 text-center">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No Completed Tasks</h3>
              <p className="text-sm text-muted-foreground">
                Completed tasks will appear here.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {completedTasks.slice(0, 20).map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  showActions={false}
                  variant="compact"
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
