// @ts-nocheck
/**
 * Maintenance Tab Component
 * Maintenance scheduling, tracking, and calendar view
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Calendar,
  Clock,
  CheckCircle,
  Wrench,
  RefreshCw
} from "lucide-react";
import { MaintenanceScheduleList } from "@/components/maintenance/MaintenanceScheduleList";
import { MaintenanceIssuesList } from "@/components/maintenance/MaintenanceIssuesList";
import { MaintenanceCalendar } from "@/components/maintenance/MaintenanceCalendar";

interface MaintenanceTabProps {
  maintenanceData: unknown[];
  enhancedMetrics: {
    maintenanceInProgress: number;
    maintenanceScheduled: number;
  };
  isLoading: boolean;
  onScheduleMaintenance: () => void;
  onRefresh: () => void;
}

export function MaintenanceTab({
  maintenanceData,
  enhancedMetrics,
  isLoading,
  onScheduleMaintenance,
  onRefresh,
}: MaintenanceTabProps) {
  const completedCount = maintenanceData?.filter(item => item.status === 'resolved').length || 0;

  return (
    <div className="space-y-4">
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
          <Button onClick={onRefresh} variant="outline" size="sm" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={onScheduleMaintenance} size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Maintenance
          </Button>
        </div>
      </div>

      {/* Maintenance Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30 dark:bg-orange-950 dark:border-orange-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-800 dark:text-orange-200">In Progress</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{enhancedMetrics.maintenanceInProgress}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 dark:bg-blue-950 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Scheduled</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{enhancedMetrics.maintenanceScheduled}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 dark:bg-green-950 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">Completed</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{completedCount}</p>
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
    </div>
  );
}
