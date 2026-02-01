import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ClipboardList, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Search,
  AlertCircle,
  User,
  Package
} from "lucide-react";
import { useStaffTasks } from "@/hooks/useStaffTasks";
import { useAuth } from "@/hooks/useAuth";
import { useRolePermissions } from "@/hooks/useRolePermissions";
import { TaskCard } from "@/components/tasks/TaskCard";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { SupplyRequestTracking } from "@/components/supply/SupplyRequestTracking";

export default function Tasks() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { userRole } = useRolePermissions();
  
  // Court aides default to "my-tasks" tab, others to "active"
  const isCourtAide = userRole === 'court_aide';
  const defaultTab = searchParams.get('tab') || (isCourtAide ? 'my-tasks' : 'active');
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [searchQuery, setSearchQuery] = useState("");

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
    refetch 
  } = useStaffTasks();

  // Filter tasks by status
  const pendingTasks = tasks.filter(t => t.status === 'pending_approval');
  const activeTasks = tasks.filter(t => ['approved', 'claimed', 'in_progress'].includes(t.status));
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const rejectedTasks = tasks.filter(t => ['rejected', 'cancelled'].includes(t.status));
  
  // My tasks: tasks claimed by or assigned to current user
  const myTasks = tasks.filter(t => 
    (t.claimed_by === user?.id || t.assigned_to === user?.id) && 
    ['claimed', 'in_progress'].includes(t.status)
  );
  
  // Available tasks: approved but not claimed
  const availableTasks = activeTasks.filter(t => t.status === 'approved' && !t.claimed_by);

  // Apply search filter
  const filterBySearch = (taskList: typeof tasks) => {
    if (!searchQuery.trim()) return taskList;
    const query = searchQuery.toLowerCase();
    return taskList.filter(t => 
      t.title?.toLowerCase().includes(query) ||
      t.description?.toLowerCase().includes(query) ||
      t.requester?.full_name?.toLowerCase().includes(query) ||
      t.claimer?.full_name?.toLowerCase().includes(query)
    );
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

  // Stats vary based on role
  const stats = isCourtAide ? [
    {
      label: "My Active Tasks",
      value: myTasks.length,
      icon: User,
      color: "text-green-500",
      bgColor: "bg-green-500/10"
    },
    {
      label: "Available to Claim",
      value: availableTasks.length,
      icon: Clock,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10"
    },
    {
      label: "Completed",
      value: completedTasks.length,
      icon: CheckCircle2,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    {
      label: "All Active",
      value: activeTasks.length,
      icon: ClipboardList,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10"
    }
  ] : [
    {
      label: "Pending Approval",
      value: pendingTasks.length,
      icon: Clock,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10"
    },
    {
      label: "Active Tasks",
      value: activeTasks.length,
      icon: ClipboardList,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    {
      label: "Completed",
      value: completedTasks.length,
      icon: CheckCircle2,
      color: "text-green-500",
      bgColor: "bg-green-500/10"
    },
    {
      label: "Rejected/Cancelled",
      value: rejectedTasks.length,
      icon: XCircle,
      color: "text-muted-foreground",
      bgColor: "bg-muted"
    }
  ];

  const renderTaskList = (taskList: typeof tasks, emptyMessage: string, showClaimActions: boolean = false) => {
    const filtered = filterBySearch(taskList);
    
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
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map(task => (
          <TaskCard 
            key={task.id} 
            task={task}
            onApprove={handleApprove}
            onReject={handleReject}
            onCancel={handleCancel}
            onClaim={showClaimActions || isCourtAide ? handleClaim : undefined}
            onStart={showClaimActions || isCourtAide ? handleStart : undefined}
            onComplete={showClaimActions || isCourtAide ? handleComplete : undefined}
            showActions={true}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <ClipboardList className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {isCourtAide ? 'My Tasks' : 'Tasks'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isCourtAide 
                ? 'View, claim, and complete tasks assigned to you'
                : 'Manage staff tasks and approvals'
              }
            </p>
          </div>
        </div>
        <CreateTaskDialog />
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {stats.map(stat => (
          <Card key={stat.label} className="relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
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

      {/* Search */}
      <div className="flex items-center gap-2 max-w-md">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-9"
        />
      </div>

      {/* Tabs - Different for Court Aides */}
      {isCourtAide ? (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
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
            <TabsTrigger value="supply-orders" className="gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Supply Orders</span>
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
                {renderTaskList(myTasks, "No active tasks. Claim one from the Available tab!", true)}
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
                {renderTaskList(availableTasks, "No tasks available to claim right now", true)}
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
                {renderTaskList(activeTasks, "No active tasks", true)}
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
                {renderTaskList(completedTasks, "No completed tasks yet")}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="supply-orders" className="mt-6">
            <SupplyRequestTracking userRole="supply_staff" />
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
            <TabsTrigger value="completed" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span className="hidden sm:inline">Completed</span>
            </TabsTrigger>
            <TabsTrigger value="rejected" className="gap-2">
              <XCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Rejected</span>
            </TabsTrigger>
            <TabsTrigger value="supply-orders" className="gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Supply Orders</span>
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
                {renderTaskList(pendingTasks, "No pending tasks")}
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
                {renderTaskList(activeTasks, "No active tasks")}
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
                  Successfully completed tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderTaskList(completedTasks, "No completed tasks yet")}
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
                {renderTaskList(rejectedTasks, "No rejected or cancelled tasks")}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="supply-orders" className="mt-6">
            <SupplyRequestTracking userRole="supply_manager" />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
