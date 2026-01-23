/**
 * TaskWorkQueue Component
 * 
 * Displays tasks for Court Aides in a work-focused layout
 * Shows active tasks and available tasks to claim
 */

import { useState } from 'react';
import { useStaffTasks } from '@/hooks/useStaffTasks';
import { useAuth } from '@/hooks/useAuth';
import { TaskCard } from '@/components/tasks/TaskCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Inbox, ClipboardList, Play } from 'lucide-react';
import type { StaffTask } from '@/types/staffTasks';

export function TaskWorkQueue() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('my-tasks');

  // Fetch my active tasks (claimed by me or in progress)
  const { 
    tasks: myTasks, 
    isLoading: myTasksLoading,
    claimTask,
    startTask,
    completeTask,
    cancelTask,
  } = useStaffTasks({
    onlyMyTasks: true,
    status: ['claimed', 'in_progress'],
  });

  // Fetch available tasks (approved but unclaimed)
  const { 
    tasks: availableTasks, 
    isLoading: availableLoading,
    claimTask: claimAvailable,
  } = useStaffTasks({
    status: 'approved',
  });

  // Filter available tasks to show only unclaimed ones
  const unclaimedTasks = availableTasks.filter(t => !t.claimed_by);

  const handleClaim = (taskId: string) => {
    claimTask.mutate(taskId);
  };

  const handleStart = (taskId: string) => {
    startTask.mutate(taskId);
  };

  const handleComplete = (taskId: string, notes?: string) => {
    completeTask.mutate({ taskId, notes });
  };

  const handleCancel = (taskId: string) => {
    cancelTask.mutate(taskId);
  };

  const isLoading = myTasksLoading || availableLoading;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Task Queue
          </CardTitle>
          {!isLoading && (
            <div className="flex gap-2">
              {myTasks.length > 0 && (
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {myTasks.length} Active
                </Badge>
              )}
              {unclaimedTasks.length > 0 && (
                <Badge variant="outline">
                  {unclaimedTasks.length} Available
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mx-4 mb-2" style={{ width: 'calc(100% - 2rem)' }}>
            <TabsTrigger value="my-tasks" className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              My Tasks
              {myTasks.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {myTasks.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="available" className="flex items-center gap-2">
              <Inbox className="h-4 w-4" />
              Available
              {unclaimedTasks.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {unclaimedTasks.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[400px]">
            <TabsContent value="my-tasks" className="m-0 px-4 pb-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : myTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="font-medium">No active tasks</p>
                  <p className="text-sm">Check available tasks to claim work</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      variant="compact"
                      onStart={handleStart}
                      onComplete={handleComplete}
                      onCancel={handleCancel}
                      isLoading={startTask.isPending || completeTask.isPending}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="available" className="m-0 px-4 pb-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : unclaimedTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Inbox className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="font-medium">No available tasks</p>
                  <p className="text-sm">All tasks have been claimed</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {unclaimedTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      variant="compact"
                      onClaim={handleClaim}
                      isLoading={claimTask.isPending || claimAvailable.isPending}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
}
