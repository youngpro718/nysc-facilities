import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  AlertTriangle, 
  Wrench, 
  Plus, 
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Activity,
  Users,
  BarChart3,
  RefreshCw,
  Zap,
  Boxes
} from "lucide-react";

// Import existing components
import { EnhancedIssuesList } from "@/components/admin-issues/EnhancedIssuesList";
import { IssueAnalyticsPanel } from "@/components/admin-issues/IssueAnalyticsPanel";
import { IssueGroupingControls } from "@/components/admin-issues/IssueGroupingControls";
import { MaintenanceScheduleList } from "@/components/maintenance/MaintenanceScheduleList";
import { MaintenanceIssuesList } from "@/components/maintenance/MaintenanceIssuesList";
import { MaintenanceCalendar } from "@/components/maintenance/MaintenanceCalendar";
import AdvancedAnalyticsDashboard from "@/components/analytics/AdvancedAnalyticsDashboard";
import type { GroupingMode, ViewMode, StatusFilter, PriorityFilter } from "@/types/issues";


// Import dialogs
import { IssueDialog } from "@/components/issues/IssueDialog";
import { IssueDialogManager } from "@/components/issues/components/IssueDialogManager";
import { useDialogManager } from "@/hooks/useDialogManager";
import { ScheduleMaintenanceDialog } from "@/components/maintenance/ScheduleMaintenanceDialog";
import { ReportIssueDialog } from "@/components/maintenance/ReportIssueDialog";



// Import hooks
import { useAdminIssuesData } from "@/hooks/dashboard/useAdminIssuesData";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Breadcrumb } from "@/components/layout/Breadcrumb";

export default function Operations() {
  const [searchParams, setSearchParams] = useSearchParams();
  const buildingId = searchParams.get('building');
  const filter = searchParams.get('filter');
  const issueIdParam = searchParams.get('issue_id');
  const tabParam = searchParams.get('tab');
  const roomIdParam = searchParams.get('room_id');
  
  const [activeTab, setActiveTab] = useState(tabParam || (buildingId || roomIdParam ? "issues" : "overview"));
  const viewParam = searchParams.get('view');

  // Issues tab local state
  // Load persisted settings
  const persistedView = ((): ViewMode | null => {
    try { return (localStorage.getItem('issues.viewMode') as ViewMode) || null; } catch { return null; }
  })();
  const persistedGrouping = ((): GroupingMode | null => {
    try { return (localStorage.getItem('issues.groupingMode') as GroupingMode) || null; } catch { return null; }
  })();
  const persistedStatus = ((): StatusFilter | null => {
    try { return (localStorage.getItem('issues.statusFilter') as StatusFilter) || null; } catch { return null; }
  })();
  const persistedPriority = ((): PriorityFilter | null => {
    try { return (localStorage.getItem('issues.priorityFilter') as PriorityFilter) || null; } catch { return null; }
  })();

  const [groupingMode, setGroupingMode] = useState<GroupingMode>(persistedGrouping || 'priority');
  const [viewMode, setViewMode] = useState<ViewMode>(
    viewParam && ['cards','table','timeline','board'].includes(viewParam)
      ? (viewParam as ViewMode)
      : (persistedView || 'table')
  );
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(persistedStatus || 'all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>(persistedPriority || 'all');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const refreshTimerRef = useRef<number | null>(null);

  // Clear building filter
  const clearBuildingFilter = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('building');
    setSearchParams(newParams);
  };

  // Persist preferences
  useEffect(() => {
    try { localStorage.setItem('issues.viewMode', viewMode); } catch {}
  }, [viewMode]);
  useEffect(() => {
    try { localStorage.setItem('issues.groupingMode', groupingMode); } catch {}
  }, [groupingMode]);
  useEffect(() => {
    try { localStorage.setItem('issues.statusFilter', statusFilter); } catch {}
  }, [statusFilter]);
  useEffect(() => {
    try { localStorage.setItem('issues.priorityFilter', priorityFilter); } catch {}
  }, [priorityFilter]);

  // Debounce search input -> searchQuery
  useEffect(() => {
    const id = window.setTimeout(() => setSearchQuery(searchInput), 300);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  // (moved) Auto-refresh toggle is defined after refreshIssues is available

  // Set building filter
  const setBuildingFilter = (buildingId: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('building', buildingId);
    setSearchParams(newParams);
  };
  const [showCreateIssue, setShowCreateIssue] = useState(false);
  const [showScheduleMaintenance, setShowScheduleMaintenance] = useState(false);
  const [showReportIssue, setShowReportIssue] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Keep URL `tab` param in sync when switching tabs
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', value);
    setSearchParams(newParams);
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('view', mode);
    newParams.set('tab', 'issues');
    setSearchParams(newParams);
  };

  // Dialog manager for issue details opened via URL param
  const { dialogState, openDialog, closeDialog } = useDialogManager();

  useEffect(() => {
    if (issueIdParam) {
      openDialog('issueDetails', { issueId: issueIdParam });
      handleTabChange('issues');
    } else {
      if (dialogState.isOpen && dialogState.type === 'issueDetails') {
        closeDialog();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issueIdParam]);

  // React to `tab` query param changes
  useEffect(() => {
    if (tabParam && ['overview','issues','maintenance','analytics'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabParam]);

  // React to `view` query param changes
  useEffect(() => {
    if (viewParam && ['cards','table','timeline','board'].includes(viewParam)) {
      setViewMode(viewParam as ViewMode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewParam]);

  const handleCloseIssueDialog = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('issue_id');
    setSearchParams(newParams);
    closeDialog();
  };

  // Get current user
  const { user } = useAuth();

  // Fetch issues data
  const {
    allIssues,
    criticalIssues,
    issueStats,
    isLoading: issuesLoading,
    refreshData: refreshIssues
  } = useAdminIssuesData();

  // Auto-refresh toggle (now that refreshIssues is defined)
  useEffect(() => {
    if (autoRefresh) {
      refreshTimerRef.current = window.setInterval(() => {
        refreshIssues();
      }, 30000) as unknown as number;
    } else if (refreshTimerRef.current) {
      window.clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
    return () => {
      if (refreshTimerRef.current) {
        window.clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [autoRefresh, refreshIssues]);

  // Fetch maintenance data
  const { data: maintenanceData = [], isLoading: maintenanceLoading } = useQuery({
    queryKey: ['maintenanceOverview'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('issues')
        .select('*')
        .in('issue_type', ['BUILDING_SYSTEMS', 'ELECTRICAL_NEEDS', 'GENERAL_REQUESTS'])
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Calculate enhanced metrics
  const enhancedMetrics = useMemo(() => {
    const maintenanceInProgress = maintenanceData.filter(item => item.status === 'in_progress').length;
    const maintenanceScheduled = maintenanceData.filter(item => item.status === 'open').length;
    
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const resolvedToday = allIssues?.filter(issue => {
      const resolvedDate = new Date(issue.created_at);
      return issue.status === 'resolved' && resolvedDate >= todayStart;
    }).length || 0;

    return {
      activeIssues: (issueStats?.open || 0) + (issueStats?.in_progress || 0),
      criticalCount: criticalIssues?.length || 0,
      inProgress: issueStats?.in_progress || 0,
      resolvedToday,
      maintenanceInProgress,
      maintenanceScheduled,
      totalMaintenanceItems: maintenanceData.length
    };
  }, [allIssues, criticalIssues, issueStats, maintenanceData]);

  // Loading state
  const isLoading = issuesLoading || maintenanceLoading;

  // Refresh all data
  const refreshAllData = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refreshIssues(),
        // Add other refresh functions as needed
      ]);
      toast.success('Operations data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Failed to refresh some data');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <Breadcrumb />
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-3xl font-bold tracking-tight">Operations</h2>
              <Badge variant="secondary" className="text-xs">
                <Activity className="h-3 w-3 mr-1" />
                Live
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Monitor and manage facility operations
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {buildingId && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearBuildingFilter}
                className="text-sm"
              >
                <X className="w-4 h-4 mr-1" />
                Clear Filter
              </Button>
            )}
            <Button onClick={() => setShowCreateIssue(true)} variant="outline" size="sm" className="touch-target">
              <AlertTriangle className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Report Issue</span>
              <span className="sm:hidden">Report</span>
            </Button>
            <Button onClick={() => setShowScheduleMaintenance(true)} size="sm" className="touch-target">
              <Calendar className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Schedule Maintenance</span>
              <span className="sm:hidden">Schedule</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Building Filter - Converted to dropdown for mobile */}
      <div className="flex items-center gap-2 p-3 sm:p-4 border rounded-lg bg-muted/50">
        <span className="text-xs sm:text-sm font-medium text-muted-foreground whitespace-nowrap">Building:</span>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={!buildingId ? "default" : "outline"}
            size="sm"
            onClick={clearBuildingFilter}
            className="text-xs sm:text-sm"
          >
            All
          </Button>
          <Button
            variant={buildingId === '7a9d7532-ebe7-496f-b5f1-10887f91edd5' ? "default" : "outline"}
            size="sm"
            onClick={() => setBuildingFilter('7a9d7532-ebe7-496f-b5f1-10887f91edd5')}
            className="text-xs sm:text-sm"
          >
            100 Centre
          </Button>
          <Button
            variant={buildingId === 'c735c6a8-7c61-4417-b2e3-3ebbb3045db7' ? "default" : "outline"}
            size="sm"
            onClick={() => setBuildingFilter('c735c6a8-7c61-4417-b2e3-3ebbb3045db7')}
            className="text-xs sm:text-sm"
          >
            111 Centre
          </Button>
        </div>
      </div>


      {/* Enhanced Quick Stats Overview */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-12 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Issues</CardTitle>
              <div className="relative">
                <AlertCircle className="h-4 w-4 text-destructive" />
                {enhancedMetrics.criticalCount > 0 && (
                  <div className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{enhancedMetrics.activeIssues}</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{enhancedMetrics.criticalCount} critical</span>
                {enhancedMetrics.criticalCount > 0 && (
                  <Badge variant="destructive" className="text-xs px-1 py-0">
                    High Priority
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{enhancedMetrics.inProgress}</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Being worked on</span>
                <div className="flex items-center gap-1">
                  <Wrench className="h-3 w-3" />
                  <span>{enhancedMetrics.maintenanceInProgress} maintenance</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{enhancedMetrics.resolvedToday}</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Completed today</span>
                {enhancedMetrics.resolvedToday > 0 && (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                )}
              </div>
            </CardContent>
          </Card>


        </div>
      )}

      {/* Additional Metrics Row */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">


          <Card className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Maintenance Queue</p>
                  <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{enhancedMetrics.totalMaintenanceItems}</p>
                  <p className="text-xs text-orange-600 dark:text-orange-400">
                    {enhancedMetrics.maintenanceScheduled} scheduled • {enhancedMetrics.maintenanceInProgress} active
                  </p>
                </div>
                <Wrench className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">System Performance</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">98%</p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Operational efficiency • All systems nominal
                  </p>
                </div>
                <Zap className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="issues" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Issues
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Maintenance
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Actions Section */}
          <Card className="border-2 border-dashed border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Most commonly used operations for efficient facility management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  onClick={() => setShowCreateIssue(true)} 
                  variant="outline" 
                  className="h-24 p-4 flex flex-col items-center gap-2 hover:bg-red-50 hover:border-red-200 transition-colors group"
                >
                  <AlertTriangle className="h-8 w-8 text-red-500 group-hover:scale-110 transition-transform" />
                  <div className="text-center">
                    <div className="font-semibold text-sm">Report Issue</div>
                    <div className="text-xs text-muted-foreground">Create new issue ticket</div>
                  </div>
                </Button>
                <Button 
                  onClick={() => setShowScheduleMaintenance(true)} 
                  variant="outline" 
                  className="h-24 p-4 flex flex-col items-center gap-2 hover:bg-blue-50 hover:border-blue-200 transition-colors group"
                >
                  <Calendar className="h-8 w-8 text-blue-500 group-hover:scale-110 transition-transform" />
                  <div className="text-center">
                    <div className="font-semibold text-sm">Schedule Maintenance</div>
                    <div className="text-xs text-muted-foreground">Plan maintenance tasks</div>
                  </div>
                </Button>

              </div>
            </CardContent>
          </Card>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Critical Issues - Takes 2 columns */}
            <div className="lg:col-span-2">
              <Card className="border-l-4 border-l-red-500">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <div className="relative">
                        <AlertCircle className="h-5 w-5 text-red-500" />
                        {enhancedMetrics.criticalCount > 0 && (
                          <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
                        )}
                      </div>
                      Critical Issues
                      {enhancedMetrics.criticalCount > 0 && (
                        <Badge variant="destructive" className="ml-2 animate-pulse">
                          {enhancedMetrics.criticalCount}
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>Issues requiring immediate attention and action</CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleTabChange('issues')}
                    className="hover:bg-red-50 hover:border-red-200"
                  >
                    View All Issues
                  </Button>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-3">
                      {Array(3).fill(0).map((_, i) => (
                        <div key={i} className="flex items-center space-x-4">
                          <Skeleton className="h-12 w-12 rounded" />
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-3 w-2/3" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : criticalIssues && criticalIssues.length > 0 ? (
                    <EnhancedIssuesList 
                      issues={criticalIssues.slice(0, 5)} // Show only first 5
                      viewMode="cards"
                      groupingMode="priority"
                      searchQuery=""
                      selectedIssues={[]}
                      onSelectionChange={() => {}}
                      onIssueUpdate={refreshAllData}
                      isLoading={false}
                    />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                      <p className="font-medium">No critical issues</p>
                      <p className="text-sm">All systems are operating normally</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar with Maintenance and Key Info */}
            <div className="space-y-6">
              {/* Maintenance Summary */}
              <Card className="border-l-4 border-l-orange-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-orange-500" />
                    Maintenance Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 rounded-lg border border-orange-200 dark:border-orange-800">
                    <div>
                      <p className="font-semibold text-orange-900 dark:text-orange-100">In Progress</p>
                      <p className="text-3xl font-bold text-orange-600">{enhancedMetrics.maintenanceInProgress}</p>
                    </div>
                    <Clock className="h-10 w-10 text-orange-500" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div>
                      <p className="font-semibold text-blue-900 dark:text-blue-100">Scheduled</p>
                      <p className="text-3xl font-bold text-blue-600">{enhancedMetrics.maintenanceScheduled}</p>
                    </div>
                    <Calendar className="h-10 w-10 text-blue-500" />
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full hover:bg-orange-50 hover:border-orange-200 transition-colors"
                    onClick={() => handleTabChange('maintenance')}
                  >
                    View All Maintenance
                  </Button>
                </CardContent>
              </Card>


            </div>
          </div>
        </TabsContent>

        <TabsContent value="issues" className="space-y-4">
          {/* Issues Management Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Issues Management
              </h3>
              <p className="text-sm text-muted-foreground">
                Track, manage, and resolve facility issues efficiently
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={refreshAllData} variant="outline" size="sm" disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                onClick={() => setAutoRefresh(v => !v)}
                variant={autoRefresh ? 'default' : 'outline'}
                size="sm"
              >
                {autoRefresh ? 'Auto-refresh: On' : 'Auto-refresh: Off'}
              </Button>
              <Button onClick={() => setShowCreateIssue(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Report Issue
              </Button>
            </div>
          </div>

          {/* Quick Stats for Issues */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-800 dark:text-red-200">Critical Issues</p>
                    <p className="text-2xl font-bold text-red-600">{enhancedMetrics.criticalCount}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-800 dark:text-orange-200">In Progress</p>
                    <p className="text-2xl font-bold text-orange-600">{enhancedMetrics.inProgress}</p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Active Issues</p>
                    <p className="text-2xl font-bold text-blue-600">{enhancedMetrics.activeIssues}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">Resolved Today</p>
                    <p className="text-2xl font-bold text-green-600">{enhancedMetrics.resolvedToday}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Issues Controls */}
          <IssueGroupingControls
            groupingMode={groupingMode}
            viewMode={viewMode}
            onGroupingChange={setGroupingMode}
            onViewModeChange={handleViewModeChange}
            searchQuery={searchInput}
            onSearchChange={setSearchInput}
            totalIssues={allIssues?.length || 0}
            selectedCount={selectedIssues.length}
            statusFilter={statusFilter}
            priorityFilter={priorityFilter}
            onStatusFilterChange={setStatusFilter}
            onPriorityFilterChange={setPriorityFilter}
          />

          {/* Quick filter presets */}
          <div className="flex flex-wrap gap-2">
            <Button variant={statusFilter === 'open' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('open')}>Open</Button>
            <Button variant={priorityFilter === 'high' ? 'default' : 'outline'} size="sm" onClick={() => setPriorityFilter('high')}>High Priority</Button>
            <Button variant="outline" size="sm" onClick={() => { setStatusFilter('all'); setPriorityFilter('all'); setGroupingMode('priority'); setSearchInput(''); }}>Clear</Button>
          </div>

          {/* Issues Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    All Issues ({allIssues?.length || 0})
                  </CardTitle>
                  <CardDescription>
                    Complete list of facility issues with detailed information and management options
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <EnhancedIssuesList 
                issues={allIssues || []}
                viewMode={viewMode}
                groupingMode={groupingMode}
                searchQuery={searchQuery}
                selectedIssues={selectedIssues}
                onSelectionChange={setSelectedIssues}
                onIssueUpdate={refreshAllData}
                isLoading={isLoading}
                buildingId={buildingId}
                filter={filter}
                statusFilter={statusFilter}
                priorityFilter={priorityFilter}
                roomId={roomIdParam}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          {/* Maintenance Management Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Maintenance Management
              </h3>
              <p className="text-sm text-muted-foreground">
                Schedule, track, and manage facility maintenance tasks
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={refreshAllData} variant="outline" size="sm" disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button onClick={() => setShowScheduleMaintenance(true)} size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Maintenance
              </Button>
            </div>
          </div>

          {/* Maintenance Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-800 dark:text-orange-200">In Progress</p>
                    <p className="text-2xl font-bold text-orange-600">{enhancedMetrics.maintenanceInProgress}</p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Scheduled</p>
                    <p className="text-2xl font-bold text-blue-600">{enhancedMetrics.maintenanceScheduled}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">Completed</p>
                    <p className="text-2xl font-bold text-green-600">{maintenanceData?.filter(item => item.status === 'resolved').length || 0}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Calendar View */}
            <MaintenanceCalendar />

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Scheduled Maintenance
                    </CardTitle>
                    <CardDescription>
                      Upcoming and planned maintenance tasks
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <MaintenanceScheduleList />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Wrench className="h-5 w-5" />
                      Maintenance Issues ({maintenanceData?.length || 0})
                    </CardTitle>
                    <CardDescription>
                      Issues requiring maintenance attention
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <MaintenanceIssuesList />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Advanced Analytics Dashboard
              </CardTitle>
              <CardDescription>
                Comprehensive facility analytics with AI-powered insights and predictive maintenance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdvancedAnalyticsDashboard />
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      {/* Issue Details Dialog driven by URL param */}
      <IssueDialogManager 
        dialogState={dialogState} 
        onClose={handleCloseIssueDialog} 
      />

      {/* Dialogs */}
      <IssueDialog 
        open={showCreateIssue} 
        onOpenChange={setShowCreateIssue}
        onSuccess={() => {
          // After creating an issue, immediately refresh and take user to Issues tab
          refreshAllData();
          handleTabChange('issues');
        }}
      />
      
      <ScheduleMaintenanceDialog 
        open={showScheduleMaintenance} 
        onOpenChange={setShowScheduleMaintenance}
      />
      
      <ReportIssueDialog 
        open={showReportIssue} 
        onOpenChange={setShowReportIssue}
      />
    </div>
  );
}
