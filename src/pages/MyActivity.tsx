/**
 * MY ACTIVITY - Unified Activity Hub
 * 
 * Consolidates all user activity into one place:
 * - Supply Requests
 * - Key Requests  
 * - Issues Reported
 * - Task Requests
 */

import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { 
  Package, 
  Key, 
  AlertTriangle, 
  Clock, 
  Plus,
  Filter,
  ChevronLeft,
  Activity,
  CheckCircle,
  XCircle,
  Loader2,
  FileText,
  Wrench,
  ClipboardList
} from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useSupplyRequests } from "@/hooks/useSupplyRequests";
import { useKeyRequests } from "@/hooks/useKeyRequests";
import { useUserIssues } from "@/hooks/dashboard/useUserIssues";
import { useStaffTasks } from "@/hooks/useStaffTasks";
import { useOccupantAssignments } from "@/hooks/occupants/useOccupantAssignments";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { PullToRefresh } from "@/components/ui/PullToRefresh";
import { useIsMobile } from "@/hooks/use-mobile";
import { UserTasksTab } from "@/components/tasks/UserTasksTab";
import { SimpleReportWizard } from "@/components/issues/wizard/SimpleReportWizard";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";

// Status configurations
const supplyStatusConfig: Record<string, { icon: unknown; label: string; color: string }> = {
  submitted: { icon: Clock, label: "Submitted", color: "bg-blue-500" },
  pending: { icon: Clock, label: "Pending", color: "bg-yellow-500" },
  approved: { icon: CheckCircle, label: "Approved", color: "bg-green-500" },
  in_progress: { icon: Loader2, label: "In Progress", color: "bg-blue-500" },
  ready: { icon: Package, label: "Ready for Pickup", color: "bg-purple-500" },
  completed: { icon: CheckCircle, label: "Completed", color: "bg-green-600" },
  rejected: { icon: XCircle, label: "Rejected", color: "bg-red-500" },
  cancelled: { icon: XCircle, label: "Cancelled", color: "bg-gray-500" },
};

const keyStatusConfig: Record<string, { icon: unknown; label: string; color: string }> = {
  pending: { icon: Clock, label: "Pending Review", color: "bg-yellow-500" },
  approved: { icon: CheckCircle, label: "Approved", color: "bg-green-500" },
  rejected: { icon: XCircle, label: "Rejected", color: "bg-red-500" },
  fulfilled: { icon: Key, label: "Fulfilled", color: "bg-blue-500" },
};

const issueStatusConfig: Record<string, { icon: unknown; label: string; color: string }> = {
  open: { icon: AlertTriangle, label: "Open", color: "bg-red-500" },
  in_progress: { icon: Wrench, label: "In Progress", color: "bg-yellow-500" },
  resolved: { icon: CheckCircle, label: "Resolved", color: "bg-green-500" },
  closed: { icon: CheckCircle, label: "Closed", color: "bg-gray-500" },
};

export default function MyActivity() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  // Issue wizard state
  const [showIssueWizard, setShowIssueWizard] = useState(false);
  const { data: occupantData, isLoading: isLoadingRooms } = useOccupantAssignments(user?.id || '');
  
  // Get tab from URL or default to 'supplies'
  const activeTab = searchParams.get('tab') || 'supplies';
  
  // Data hooks
  const { data: supplyRequests = [], isLoading: supplyLoading, refetch: refetchSupply } = useSupplyRequests(user?.id);
  const { data: keyRequests = [], isLoading: keyLoading, refetch: refetchKeys } = useKeyRequests(user?.id);
  const { userIssues: issues = [], isLoading: issuesLoading, refetchIssues } = useUserIssues(user?.id);
  const { tasks: taskRequests = [], isLoading: tasksLoading, refetch: refetchTasks } = useStaffTasks({ userId: user?.id });

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  const handleRefresh = async () => {
    await Promise.all([refetchSupply(), refetchKeys(), refetchIssues(), refetchTasks()]);
  };

  const handleIssueCreated = () => {
    setShowIssueWizard(false);
    refetchIssues();
  };

  // Calculate counts for badges
  const activeSupplyCount = supplyRequests.filter(r => !['completed', 'cancelled', 'rejected'].includes(r.status)).length;
  const activeKeyCount = keyRequests.filter(r => !['fulfilled', 'rejected'].includes(r.status)).length;
  const activeIssueCount = issues.filter(i => !['resolved', 'closed'].includes(i.status)).length;
  const activeTaskCount = taskRequests.filter(t => !['completed', 'cancelled', 'rejected'].includes(t.status)).length;

  const isLoading = supplyLoading || keyLoading || issuesLoading || tasksLoading;

  const content = (
    <div className="space-y-4 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(-1)}
            className="h-9 w-9"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">My Activity</h1>
            <p className="text-sm text-muted-foreground">
              Track all your requests and issues
            </p>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button 
            size="sm" 
            onClick={() => navigate('/request')}
            className="hidden sm:flex"
          >
            <Plus className="h-4 w-4 mr-1" />
            New Request
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-3">
        <Card 
          className={`cursor-pointer transition-all ${activeTab === 'supplies' ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
          onClick={() => handleTabChange('supplies')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Package className="h-5 w-5 text-green-600" />
              <Badge variant={activeSupplyCount > 0 ? "default" : "secondary"}>
                {activeSupplyCount}
              </Badge>
            </div>
            <p className="text-sm font-medium mt-2">Supplies</p>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all ${activeTab === 'keys' ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
          onClick={() => handleTabChange('keys')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Key className="h-5 w-5 text-blue-600" />
              <Badge variant={activeKeyCount > 0 ? "default" : "secondary"}>
                {activeKeyCount}
              </Badge>
            </div>
            <p className="text-sm font-medium mt-2">Keys</p>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all ${activeTab === 'issues' ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
          onClick={() => handleTabChange('issues')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <Badge variant={activeIssueCount > 0 ? "destructive" : "secondary"}>
                {activeIssueCount}
              </Badge>
            </div>
            <p className="text-sm font-medium mt-2">Issues</p>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all ${activeTab === 'tasks' ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
          onClick={() => handleTabChange('tasks')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <ClipboardList className="h-5 w-5 text-purple-600" />
              <Badge variant={activeTaskCount > 0 ? "default" : "secondary"}>
                {activeTaskCount}
              </Badge>
            </div>
            <p className="text-sm font-medium mt-2">Tasks</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Content */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="supplies" className="relative">
            <Package className="h-4 w-4 mr-1" />
            Supplies
          </TabsTrigger>
          <TabsTrigger value="keys" className="relative">
            <Key className="h-4 w-4 mr-1" />
            Keys
          </TabsTrigger>
          <TabsTrigger value="issues" className="relative">
            <AlertTriangle className="h-4 w-4 mr-1" />
            Issues
          </TabsTrigger>
          <TabsTrigger value="tasks" className="relative">
            <ClipboardList className="h-4 w-4 mr-1" />
            Tasks
          </TabsTrigger>
        </TabsList>

        {/* Supply Requests Tab */}
        <TabsContent value="supplies" className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Supply Requests</h2>
            <Button size="sm" onClick={() => navigate('/request/supplies')}>
              <Plus className="h-4 w-4 mr-1" />
              New Request
            </Button>
          </div>
          
          {supplyLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
          ) : supplyRequests.length === 0 ? (
            <Card className="p-8 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No Supply Requests</h3>
              <p className="text-sm text-muted-foreground mb-4">
                You haven't made any supply requests yet
              </p>
              <Button onClick={() => navigate('/request/supplies')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Request
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {supplyRequests.map((request: Record<string, unknown>) => {
                const status = supplyStatusConfig[request.status] || supplyStatusConfig.pending;
                const StatusIcon = status.icon;
                return (
                  <Card key={request.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{request.title || 'Supply Request'}</h3>
                            <Badge variant="outline" className="text-xs">
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {status.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {request.description || `${request.supply_request_items?.length || 0} items`}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {request.created_at && format(new Date(request.created_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => navigate(`/my-supply-requests?id=${request.id}`)}
                        >
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Key Requests Tab */}
        <TabsContent value="keys" className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Key Requests</h2>
            <Button size="sm" onClick={() => navigate('/my-requests?new=1')}>
              <Plus className="h-4 w-4 mr-1" />
              New Request
            </Button>
          </div>
          
          {keyLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
          ) : keyRequests.length === 0 ? (
            <Card className="p-8 text-center">
              <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No Key Requests</h3>
              <p className="text-sm text-muted-foreground mb-4">
                You haven't made any key requests yet
              </p>
              <Button onClick={() => navigate('/my-requests?new=1')}>
                <Plus className="h-4 w-4 mr-2" />
                Request a Key
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {keyRequests.map((request: Record<string, unknown>) => {
                const status = keyStatusConfig[request.status] || keyStatusConfig.pending;
                const StatusIcon = status.icon;
                return (
                  <Card key={request.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">
                              {request.request_type === 'new_key' ? 'New Key' : 
                               request.request_type === 'replacement' ? 'Replacement Key' : 
                               'Key Request'}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {status.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {request.justification || 'No description'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {request.created_at && format(new Date(request.created_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => navigate(`/my-requests?id=${request.id}`)}
                        >
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Issues Tab */}
        <TabsContent value="issues" className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Reported Issues</h2>
            <Button size="sm" onClick={() => setShowIssueWizard(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Report Issue
            </Button>
          </div>
          
          {issuesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
          ) : issues.length === 0 ? (
            <Card className="p-8 text-center">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <h3 className="font-semibold mb-2">No Issues Reported</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Everything looks good! Report an issue if you find something.
              </p>
              <Button onClick={() => setShowIssueWizard(true)}>
                <AlertTriangle className="h-4 w-4 mr-2" />
                Report an Issue
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {issues.map((issue: Record<string, unknown>) => {
                const status = issueStatusConfig[issue.status] || issueStatusConfig.open;
                const StatusIcon = status.icon;
                return (
                  <Card key={issue.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{issue.title || 'Issue Report'}</h3>
                            <Badge 
                              variant={issue.status === 'open' ? 'destructive' : 'outline'} 
                              className="text-xs"
                            >
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {status.label}
                            </Badge>
                            {issue.priority === 'urgent' && (
                              <Badge variant="destructive" className="text-xs">Urgent</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {issue.description || 'No description'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {issue.created_at && format(new Date(issue.created_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => navigate(`/my-issues`)}
                        >
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="mt-4">
          <UserTasksTab />
        </TabsContent>
      </Tabs>

      {/* Issue Wizard Dialog - opened in-place */}
      <ResponsiveDialog open={showIssueWizard} onOpenChange={setShowIssueWizard} title="">
        <SimpleReportWizard
          onSuccess={handleIssueCreated}
          onCancel={() => setShowIssueWizard(false)}
          assignedRooms={occupantData?.roomAssignments || []}
          isLoadingRooms={isLoadingRooms}
        />
      </ResponsiveDialog>
    </div>
  );

  if (isMobile) {
    return (
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="container max-w-2xl mx-auto px-4 py-4">
          {content}
        </div>
      </PullToRefresh>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-6">
      {content}
    </div>
  );
}
