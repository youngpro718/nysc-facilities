/**
 * StaffTasksTab Component
 * 
 * Tab content for Supplies Hub showing tasks for staff to claim and complete
 */

import { useState } from 'react';
import { 
  ClipboardList, 
  Clock, 
  CheckCircle, 
  Play,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useStaffTasks } from '@/hooks/useStaffTasks';
import { TaskCard } from '@/components/tasks/TaskCard';

export function StaffTasksTab() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('available');

  // Available tasks to claim
  const { 
    tasks: availableTasks, 
    isLoading: availableLoading,
    refetch: refetchAvailable,
    claimTask,
  } = useStaffTasks({ status: 'approved' });

  // My claimed/in-progress tasks
  const { 
    tasks: myTasks, 
    isLoading: myTasksLoading,
    refetch: refetchMyTasks,
    startTask,
    completeTask,
  } = useStaffTasks({ onlyMyTasks: true, status: ['claimed', 'in_progress'] });

  // My completed tasks
  const { 
    tasks: completedTasks, 
    isLoading: completedLoading,
    refetch: refetchCompleted,
  } = useStaffTasks({ onlyMyTasks: true, status: 'completed' });

  const handleRefresh = () => {
    refetchAvailable();
    refetchMyTasks();
    refetchCompleted();
  };

  const handleClaim = async (taskId: string) => {
    await claimTask.mutateAsync(taskId);
  };

  const handleStart = async (taskId: string) => {
    await startTask.mutateAsync(taskId);
  };

  const handleComplete = async (taskId: string, notes?: string) => {
    await completeTask.mutateAsync({ taskId, notes });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Tasks
          </h2>
          <p className="text-sm text-muted-foreground">
            Claim and complete assigned tasks
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card 
          className={`cursor-pointer transition-all ${activeTab === 'available' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setActiveTab('available')}
        >
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <Clock className="h-4 w-4 text-blue-600" />
              <Badge variant={availableTasks.length > 0 ? "default" : "secondary"}>
                {availableTasks.length}
              </Badge>
            </div>
            <p className="text-sm font-medium mt-1">Available</p>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all ${activeTab === 'my-tasks' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setActiveTab('my-tasks')}
        >
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <Play className="h-4 w-4 text-purple-600" />
              <Badge variant={myTasks.length > 0 ? "default" : "secondary"}>
                {myTasks.length}
              </Badge>
            </div>
            <p className="text-sm font-medium mt-1">My Tasks</p>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all ${activeTab === 'completed' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <Badge variant="secondary">
                {completedTasks.length}
              </Badge>
            </div>
            <p className="text-sm font-medium mt-1">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="available">
            Available
            {availableTasks.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                {availableTasks.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="my-tasks">
            My Tasks
            {myTasks.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                {myTasks.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="mt-4">
          {availableLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
            </div>
          ) : availableTasks.length === 0 ? (
            <Card className="p-8 text-center">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <h3 className="font-semibold mb-2">No Available Tasks</h3>
              <p className="text-sm text-muted-foreground">
                Check back later for new tasks.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {availableTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClaim={handleClaim}
                  isLoading={claimTask.isPending}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="my-tasks" className="mt-4">
          {myTasksLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
            </div>
          ) : myTasks.length === 0 ? (
            <Card className="p-8 text-center">
              <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No Active Tasks</h3>
              <p className="text-sm text-muted-foreground">
                Claim a task from the Available tab to get started.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {myTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStart={handleStart}
                  onComplete={handleComplete}
                  isLoading={startTask.isPending || completeTask.isPending}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          {completedLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
          ) : completedTasks.length === 0 ? (
            <Card className="p-8 text-center">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No Completed Tasks</h3>
              <p className="text-sm text-muted-foreground">
                Tasks you complete will appear here.
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
