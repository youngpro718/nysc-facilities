import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { isPast, isWithinInterval, addHours } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusCard } from "@/components/ui/StatusCard";
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  AlertCircle,
  User,
} from "lucide-react";
import { useStaffTasks } from "@features/tasks/hooks/useStaffTasks";
import { useAuth } from "@features/auth/hooks/useAuth";
import { useRolePermissions } from "@features/auth/hooks/useRolePermissions";
import { TaskCard } from "@features/tasks/components/TaskCard";
import { CreateTaskDialog } from "@features/tasks/components/CreateTaskDialog";
import { StaffActivityPanel } from "@features/tasks/components/StaffActivityPanel";
import { UserTasksTab } from "@features/tasks/components/UserTasksTab";
import { PageHeader } from "@/components/layout/PageHeader";
import { PullToRefresh } from "@/components/ui/PullToRefresh";
import { useIsMobile } from "@shared/hooks/use-mobile";
import { FilterPills, type FilterPillOption } from "@/components/ui/FilterPills";
import type { StaffTask, TaskType, TaskPriority } from "@features/tasks/types/staffTasks";
import { TASK_TYPE_LABELS, TASK_APPROVER_ROLES } from "@features/tasks/types/staffTasks";

const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const TYPE_FILTERS: { label: string; value: TaskType | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Move Item', value: 'move_item' },
  { label: 'Delivery', value: 'delivery' },
  { label: 'Setup', value: 'setup' },
  { label: 'Pickup', value: 'pickup' },
  { label: 'Maintenance', value: 'maintenance' },
  { label: 'General', value: 'general' },
];

const PRIORITY_FILTERS: { label: string; value: TaskPriority | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Urgent', value: 'urgent' },
  { label: 'High', value: 'high' },
  { label: 'Medium', value: 'medium' },
  { label: 'Low', value: 'low' },
];

function isOverdue(task: StaffTask): boolean {
  if (!task.due_date) return false;
  if (task.status === 'completed' || task.status === 'cancelled') return false;
  return isPast(new Date(task.due_date));
}

function sortTasks(taskList: StaffTask[]): StaffTask[] {
  return [...taskList].sort((a, b) => {
    const aOverdue = isOverdue(a);
    const bOverdue = isOverdue(b);
    // Overdue first
    if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;

    // Then by due_date ascending (no due date last)
    if (a.due_date && b.due_date) {
      const diff = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      if (diff !== 0) return diff;
    } else if (a.due_date) return -1;
    else if (b.due_date) return 1;

    // Then by priority weight
    const pw = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
    if (pw !== 0) return pw;

    // Then by created_at descending
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export default function Tasks() {
  const { userRole, isAdmin: canManageTasks } = useRolePermissions();
  const isCourtAide = userRole === 'court_aide';
  // Who may approve/reject task requests. Currently a superset of
  // canManageTasks (admin/system_admin) plus facilities_manager — kept as a
  // separate check from canManageTasks so Cancel/Delete can stay admin-only
  // while approval follows the product-defined TASK_APPROVER_ROLES list.
  const canApprove = canManageTasks || (!!userRole && TASK_APPROVER_ROLES.includes(userRole));

  // Regular users (not court aides, not managers, not approvers) get the
  // dedicated "My Requests" view — same component used on /my-activity. This is
  // the only place their own submitted tasks are surfaced. Approvers
  // (TASK_APPROVER_ROLES, e.g. facilities_manager) reach the manager view so
  // they can review/approve even though Cancel/Delete stay admin-only.
  if (!isCourtAide && !canManageTasks && !canApprove) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <PageHeader
          title="My Tasks"
          description="Track requests you've submitted"
          icon={ClipboardList}
          className="mb-0"
        />
        <UserTasksTab />
      </div>
    );
  }

  return <TasksManagerView isCourtAide={isCourtAide} canManageTasks={canManageTasks} canApprove={canApprove} />;
}

function TasksManagerView({ isCourtAide, canManageTasks, canApprove }: { isCourtAide: boolean; canManageTasks: boolean; canApprove: boolean }) {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const defaultTab = searchParams.get('tab') || (isCourtAide ? 'my-tasks' : 'active');
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TaskType | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');

  // Update tab when URL changes
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Fetch all tasks
  const {
    tasks,
    isLoading,
    approveTask,
    rejectTask,
    cancelTask,
    claimTask,
    startTask,
    completeTask,
    deleteTask,
    releaseClaim,
    refetch
  } = useStaffTasks();

  // Filter tasks by status
  const pendingTasks = tasks.filter(t => t.status === 'pending_approval');
  const activeTasks = tasks.filter(t => ['approved', 'claimed', 'in_progress'].includes(t.status));
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const rejectedTasks = tasks.filter(t => ['rejected', 'cancelled'].includes(t.status));

  // My tasks: anything currently on this user's plate — claimed by or assigned
  // to them in any non-terminal status (pending_approval, approved, claimed,
  // in_progress). An aide who has a task assigned to them while it's still
  // pending approval needs to see it without hunting through other tabs.
  const myTasks = tasks.filter(t =>
    (t.claimed_by === user?.id || t.assigned_to === user?.id) &&
    !['completed', 'cancelled', 'rejected'].includes(t.status)
  );

  // Available tasks: approved but not claimed
  const availableTasks = activeTasks.filter(t => t.status === 'approved' && !t.claimed_by);

  // Urgent task count for stats
  const urgentActiveCount = activeTasks.filter(t => t.priority === 'urgent').length;
  const hasUrgentTasks = urgentActiveCount > 0;

  // Combined filter: search + type + priority
  const applyFilters = (taskList: StaffTask[]): StaffTask[] => {
    let result = taskList;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.title?.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query) ||
        t.requester?.full_name?.toLowerCase().includes(query) ||
        t.claimer?.full_name?.toLowerCase().includes(query)
      );
    }

    if (typeFilter !== 'all') {
      result = result.filter(t => t.task_type === typeFilter);
    }

    if (priorityFilter !== 'all') {
      result = result.filter(t => t.priority === priorityFilter);
    }

    return result;
  };

  const handleApprove = async (taskId: string) => {
    await approveTask.mutateAsync({ taskId });
  };

  const handleReject = async (taskId: string, reason: string) => {
    await rejectTask.mutateAsync({ taskId, reason });
  };

  const handleCancel = async (taskId: string) => {
    await cancelTask.mutateAsync(taskId);
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

  const handleDelete = async (taskId: string) => {
    await deleteTask.mutateAsync(taskId);
  };

  const handleReleaseClaim = async (taskId: string) => {
    await releaseClaim.mutateAsync(taskId);
  };

  const renderEmptyState = (type: 'active' | 'pending' | 'available' | 'completed' | 'rejected' | 'my-tasks' | 'generic', message?: string) => {
    if (type === 'active') {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-400/60 mb-4" />
          <p className="font-medium text-muted-foreground">All caught up!</p>
          <p className="text-sm text-muted-foreground">Nothing active right now.</p>
        </div>
      );
    }
    if (type === 'pending') {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Clock className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="font-medium text-muted-foreground">No tasks waiting for approval.</p>
          <p className="text-sm text-muted-foreground">All requests have been reviewed.</p>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">{message || 'No tasks found.'}</p>
      </div>
    );
  };

  const renderTaskList = (
    taskList: StaffTask[],
    emptyType: 'active' | 'pending' | 'available' | 'completed' | 'rejected' | 'my-tasks' | 'generic',
    emptyMessage?: string,
    showClaimActions: boolean = false,
  ) => {
    const filtered = applyFilters(sortTasks(taskList));

    if (isLoading) {
      return (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      );
    }

    if (filtered.length === 0) {
      return renderEmptyState(emptyType, emptyMessage);
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" data-tour="tasks-list">
        {filtered.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            onApprove={canApprove ? handleApprove : undefined}
            onReject={canApprove ? handleReject : undefined}
            onCancel={canManageTasks ? handleCancel : undefined}
            onDelete={canManageTasks ? handleDelete : undefined}
            onClaim={showClaimActions || isCourtAide ? handleClaim : undefined}
            onStart={showClaimActions || isCourtAide ? handleStart : undefined}
            onComplete={showClaimActions || isCourtAide ? handleComplete : undefined}
            onReleaseClaim={isCourtAide && task.claimed_by === user?.id ? handleReleaseClaim : undefined}
            showActions={true}
          />
        ))}
      </div>
    );
  };

  const priorityOptions: FilterPillOption<TaskPriority | 'all'>[] = PRIORITY_FILTERS.map(f => {
    const isUrgent = f.value === 'urgent';
    const showPulse = isUrgent && hasUrgentTasks;
    return {
      ...f,
      adornment: showPulse ? (
        <span className="relative flex h-2 w-2" aria-hidden="true">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
        </span>
      ) : null,
    };
  });

  const filterBar = (
    <div className="space-y-2">
      <FilterPills
        options={TYPE_FILTERS}
        value={typeFilter}
        onChange={setTypeFilter}
        ariaLabel="Filter tasks by type"
      />
      <FilterPills
        options={priorityOptions}
        value={priorityFilter}
        onChange={setPriorityFilter}
        ariaLabel="Filter tasks by priority"
      />
    </div>
  );


  const pageContent = (
    <div className="space-y-6">
      <PageHeader
        title={isCourtAide ? 'My Tasks' : 'Tasks'}
        description={
          isCourtAide
            ? 'View, claim, and complete tasks assigned to you'
            : 'Manage staff tasks and approvals'
        }
        icon={ClipboardList}
        className="mb-0"
      >
        {canManageTasks && <CreateTaskDialog />}
      </PageHeader>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {isCourtAide ? (
          <>
            <StatusCard statusVariant="info" title="My Active Tasks" value={myTasks.length} subLabel="Claimed by you" icon={User} />
            <StatusCard statusVariant={availableTasks.length > 0 ? "warning" : "operational"} title="Available to Claim" value={availableTasks.length} subLabel="Unclaimed tasks" icon={Clock} />
            <StatusCard statusVariant="operational" title="Completed" value={completedTasks.length} subLabel="Successfully done" icon={CheckCircle2} />
            <StatusCard statusVariant="neutral" title="All Active" value={activeTasks.length} subLabel="In pipeline" icon={ClipboardList} />
          </>
        ) : (
          <>
            <StatusCard
              statusVariant="info"
              title="Active Tasks"
              value={activeTasks.length}
              subLabel={urgentActiveCount > 0 ? `${urgentActiveCount} urgent` : "In pipeline"}
              icon={ClipboardList}
            />
            <StatusCard statusVariant={pendingTasks.length > 0 ? "warning" : "operational"} title="Pending Approval" value={pendingTasks.length} subLabel="Awaiting review" icon={Clock} />
            <StatusCard statusVariant="operational" title="Completed" value={completedTasks.length} subLabel="Successfully done" icon={CheckCircle2} />
            <StatusCard statusVariant="neutral" title="Rejected" value={rejectedTasks.length} subLabel="Rejected or cancelled" icon={XCircle} />
          </>
        )}
      </div>

      {/* Search + Filter Bar */}
      <div className="space-y-3 max-w-2xl">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9"
          />
        </div>
        {filterBar}
      </div>

      {/* Tabs - Different for Court Aides */}
      {isCourtAide ? (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="my-tasks" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">My Tasks</span>
              {myTasks.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {myTasks.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="available" className="gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Available</span>
              {availableTasks.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {availableTasks.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="active" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              <span className="hidden sm:inline">All Active</span>
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span className="hidden sm:inline">Completed</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-tasks" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-green-500" />
                  My Active Tasks
                </CardTitle>
                <CardDescription>
                  Tasks you've claimed or been assigned - complete these first!
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderTaskList(myTasks, 'active', undefined, true)}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="available" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-500" />
                  Available Tasks
                </CardTitle>
                <CardDescription>
                  Approved tasks ready for you to claim and work on
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderTaskList(availableTasks, 'generic', 'No tasks available to claim right now', true)}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="active" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-blue-500" />
                  All Active Tasks
                </CardTitle>
                <CardDescription>
                  All tasks that are approved, claimed, or in progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderTaskList(activeTasks, 'active', undefined, true)}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Completed Tasks
                </CardTitle>
                <CardDescription>
                  Tasks that have been successfully completed
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderTaskList(completedTasks, 'generic', 'No completed tasks yet')}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        // Default tabs for managers/admins
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Pending</span>
              {pendingTasks.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {pendingTasks.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="active" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              <span className="hidden sm:inline">Active</span>
              {activeTasks.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeTasks.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="staff" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Staff Activity</span>
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span className="hidden sm:inline">Completed</span>
            </TabsTrigger>
            <TabsTrigger value="rejected" className="gap-2">
              <XCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Rejected</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-500" />
                  Pending Approval
                </CardTitle>
                <CardDescription>
                  Tasks submitted by users waiting for your approval
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderTaskList(pendingTasks, 'pending')}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="active" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-blue-500" />
                  Active Tasks
                </CardTitle>
                <CardDescription>
                  Tasks that are approved, claimed, or in progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderTaskList(activeTasks, 'active')}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="staff" className="mt-6">
            <StaffActivityPanel />
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Completed Tasks
                </CardTitle>
                <CardDescription>
                  Successfully completed tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderTaskList(completedTasks, 'generic', 'No completed tasks yet')}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rejected" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-muted-foreground" />
                  Rejected & Cancelled
                </CardTitle>
                <CardDescription>
                  Tasks that were rejected or cancelled
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderTaskList(rejectedTasks, 'generic', 'No rejected or cancelled tasks')}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );

  if (isMobile) {
    return <PullToRefresh onRefresh={async () => { await refetch(); }}>{pageContent}</PullToRefresh>;
  }
  return pageContent;
}

