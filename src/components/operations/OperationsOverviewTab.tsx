/**
 * Operations Overview Tab
 * Shows quick actions, critical issues, and maintenance summary
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AlertTriangle, 
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Zap,
  Wrench
} from "lucide-react";
import { EnhancedIssuesList } from "@/components/admin-issues/EnhancedIssuesList";

interface OperationsOverviewTabProps {
  enhancedMetrics: {
    activeIssues: number;
    criticalCount: number;
    inProgress: number;
    resolvedToday: number;
    maintenanceInProgress: number;
    maintenanceScheduled: number;
    totalMaintenanceItems: number;
  };
  criticalIssues: unknown[];
  isLoading: boolean;
  onCreateIssue: () => void;
  onScheduleMaintenance: () => void;
  onTabChange: (tab: string) => void;
  onRefresh: () => void;
}

export function OperationsOverviewTab({
  enhancedMetrics,
  criticalIssues,
  isLoading,
  onCreateIssue,
  onScheduleMaintenance,
  onTabChange,
  onRefresh,
}: OperationsOverviewTabProps) {
  return (
    <div className="space-y-6">
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
              onClick={onCreateIssue} 
              variant="outline" 
              className="h-24 p-4 flex flex-col items-center gap-2 hover:bg-red-50 dark:hover:bg-red-950/30 dark:bg-red-950/30 hover:border-red-200 dark:hover:border-red-800 dark:border-red-800 transition-colors group"
            >
              <AlertTriangle className="h-8 w-8 text-red-500 group-hover:scale-110 transition-transform" />
              <div className="text-center">
                <div className="font-semibold text-sm">Report Issue</div>
                <div className="text-xs text-muted-foreground">Create new issue ticket</div>
              </div>
            </Button>
            <Button 
              onClick={onScheduleMaintenance} 
              variant="outline" 
              className="h-24 p-4 flex flex-col items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-950/30 dark:bg-blue-950/30 hover:border-blue-200 dark:hover:border-blue-800 dark:border-blue-800 transition-colors group"
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
                    <Badge variant="destructive" className="ml-2">
                      {enhancedMetrics.criticalCount}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>Issues requiring immediate attention and action</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onTabChange('issues')}
                className="hover:bg-red-50 dark:hover:bg-red-950/30 dark:bg-red-950/30 hover:border-red-200 dark:hover:border-red-800 dark:border-red-800"
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
                  issues={criticalIssues.slice(0, 5)}
                  viewMode="cards"
                  groupingMode="priority"
                  searchQuery=""
                  selectedIssues={[]}
                  onSelectionChange={() => {}}
                  onIssueUpdate={onRefresh}
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

        {/* Sidebar with Maintenance Summary */}
        <div className="space-y-6">
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
                  <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{enhancedMetrics.maintenanceInProgress}</p>
                </div>
                <Clock className="h-10 w-10 text-orange-500" />
              </div>
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg border border-blue-200 dark:border-blue-800">
                <div>
                  <p className="font-semibold text-blue-900 dark:text-blue-100">Scheduled</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{enhancedMetrics.maintenanceScheduled}</p>
                </div>
                <Calendar className="h-10 w-10 text-blue-500" />
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full hover:bg-orange-50 dark:hover:bg-orange-950/30 dark:bg-orange-950/30 hover:border-orange-200 dark:hover:border-orange-800 dark:border-orange-800 transition-colors"
                onClick={() => onTabChange('maintenance')}
              >
                View All Maintenance
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
