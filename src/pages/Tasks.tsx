import { useState } from "react";
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
  AlertCircle
} from "lucide-react";
import { useStaffTasks } from "@/hooks/useStaffTasks";
import { TaskCard } from "@/components/tasks/TaskCard";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";

export default function Tasks() {
  const [activeTab, setActiveTab] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch all tasks
  const { tasks, isLoading, approveTask, rejectTask, cancelTask, refetch } = useStaffTasks();

  // Filter tasks by status
  const pendingTasks = tasks.filter(t => t.status === 'pending_approval');
  const activeTasks = tasks.filter(t => ['approved', 'claimed', 'in_progress'].includes(t.status));
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const rejectedTasks = tasks.filter(t => ['rejected', 'cancelled'].includes(t.status));

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

  const stats = [
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

  const renderTaskList = (taskList: typeof tasks, emptyMessage: string) => {
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
            showActions={task.status === 'pending_approval'}
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
            <h1 className="text-2xl font-bold">Tasks</h1>
            <p className="text-sm text-muted-foreground">
              Manage staff tasks and approvals
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
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
      </Tabs>
    </div>
  );
}
