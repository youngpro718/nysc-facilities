/**
 * TaskWorkQueue Component
 *
 * Displays tasks for Court Aides in a work-focused layout
 * Shows pending requests, active tasks, available tasks to claim, and completed history
 */

import { useState, useEffect } from 'react';
import { useStaffTasks } from '@features/tasks/hooks/useStaffTasks';
import { useAuth } from '@features/auth/hooks/useAuth';
import { TaskCard } from '@features/tasks/components/TaskCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Inbox, ClipboardList, Play, CheckCircle, MailQuestion } from 'lucide-react';

export function TaskWorkQueue() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('requests');

  // Pending requests — aides can claim these directly (approval is now a
  // non-blocking after-the-fact review by admins/facilities managers, not a
  // gate). Aides never approve or reject here.
  const {
    tasks: pendingRequests,
    isLoading: pendingLoading,
    claimTask: claimPendingTask,
  } = useStaffTasks({
    status: 'pending_approval',
  });

  // My active tasks
  const {
    tasks: myTasks,
    isLoading: myTasksLoading,
    startTask,
    completeTask,
    cancelTask,
    releaseClaim,
  } = useStaffTasks({
    onlyMyTasks: true,
    status: ['claimed', 'in_progress'],
  });

  // Available approved-but-unclaimed tasks
  const {
    tasks: availableTasks,
    isLoading: availableLoading,
    claimTask,
  } = useStaffTasks({
    status: 'approved',
  });

  // Completed tasks
  const {
    tasks: completedTasks,
    isLoading: completedLoading,
  } = useStaffTasks({
    onlyMyTasks: true,
    status: 'completed',
  });

  const unclaimedTasks = availableTasks.filter(t => !t.claimed_by);

  // Default to whichever tab has work
  useEffect(() => {
    if (pendingLoading || myTasksLoading || availableLoading) return;
    if (pendingRequests.length > 0) setActiveTab('requests');
    else if (myTasks.length > 0) setActiveTab('my-tasks');
    else if (unclaimedTasks.length > 0) setActiveTab('available');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingLoading, myTasksLoading, availableLoading]);

  const isLoading = pendingLoading || myTasksLoading || availableLoading || completedLoading;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Task Queue
          </CardTitle>
          {!isLoading && (
            <div className="flex gap-2 flex-wrap">
              {pendingRequests.length > 0 && (
                <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30">
                  {pendingRequests.length} New
                </Badge>
              )}
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
          <TabsList className="grid w-full grid-cols-4 mx-4 mb-2" style={{ width: 'calc(100% - 2rem)' }}>
            <TabsTrigger value="requests" className="flex items-center gap-1.5">
              <MailQuestion className="h-4 w-4" />
              <span className="hidden sm:inline">Requests</span>
              {pendingRequests.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {pendingRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="my-tasks" className="flex items-center gap-1.5">
              <Play className="h-4 w-4" />
              <span className="hidden sm:inline">Mine</span>
              {myTasks.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {myTasks.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="available" className="flex items-center gap-1.5">
              <Inbox className="h-4 w-4" />
              <span className="hidden sm:inline">Available</span>
              {unclaimedTasks.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {unclaimedTasks.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Done</span>
              {completedTasks.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {completedTasks.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[400px]">
            <TabsContent value="requests" className="m-0 px-4 pb-4">
              {pendingLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : pendingRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MailQuestion className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="font-medium">No new requests</p>
                  <p className="text-sm">New task requests will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingRequests.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      variant="compact"
                      onClaim={(id) => claimPendingTask.mutate(id)}
                      isLoading={claimPendingTask.isPending}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="my-tasks" className="m-0 px-4 pb-4">
              {myTasksLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : myTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="font-medium">No active tasks</p>
                  <p className="text-sm">Claim a request or available task to start work</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      variant="compact"
                      onStart={(id) => startTask.mutate(id)}
                      onComplete={(id, notes) => completeTask.mutate({ taskId: id, notes })}
                      onCancel={(id) => cancelTask.mutate(id)}
                      onReleaseClaim={task.claimed_by === user?.id ? (id) => releaseClaim.mutate(id) : undefined}
                      isLoading={startTask.isPending || completeTask.isPending}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="available" className="m-0 px-4 pb-4">
              {availableLoading ? (
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
                      onClaim={(id) => claimTask.mutate(id)}
                      isLoading={claimTask.isPending}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed" className="m-0 px-4 pb-4">
              {completedLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : completedTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="font-medium">No completed tasks</p>
                  <p className="text-sm">Tasks you complete will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {completedTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      variant="compact"
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
