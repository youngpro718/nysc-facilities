// @ts-nocheck
/**
 * Maintenance Tab Component
 * Maintenance scheduling, tracking, and calendar view
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle,
  ArrowRight,
  Calendar,
  Clock,
  CheckCircle,
  Wrench,
  RefreshCw
} from "lucide-react";
import { MaintenanceScheduleList } from "@features/operations/components/maintenance/MaintenanceScheduleList";
import { MaintenanceIssuesList } from "@features/operations/components/maintenance/MaintenanceIssuesList";
import { MaintenanceCalendar } from "@features/operations/components/maintenance/MaintenanceCalendar";

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
  const urgentCount = maintenanceData?.filter(item => ['critical', 'urgent', 'high'].includes(String(item.priority || '').toLowerCase())).length || 0;

  return (
    <div className="space-y-6">
      {/* Maintenance Management Header */}
      <Card className="border-slate-200/80 shadow-sm dark:border-slate-800">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-xl sm:text-2xl">Maintenance workbench</CardTitle>
              </div>
              <CardDescription className="max-w-2xl">
                Keep scheduled work, active issues, and urgent maintenance decisions in one operational view.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
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
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900 dark:bg-amber-950/20">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-amber-700 dark:text-amber-300">In progress</p>
                  <p className="text-3xl font-semibold text-foreground">{enhancedMetrics.maintenanceInProgress}</p>
                  <p className="text-xs text-amber-700/80 dark:text-amber-300/80">Tasks currently being worked</p>
                </div>
                <Clock className="h-6 w-6 text-amber-500" />
              </div>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 dark:border-blue-900 dark:bg-blue-950/20">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-blue-700 dark:text-blue-300">Scheduled</p>
                  <p className="text-3xl font-semibold text-foreground">{enhancedMetrics.maintenanceScheduled}</p>
                  <p className="text-xs text-blue-700/80 dark:text-blue-300/80">Upcoming planned work</p>
                </div>
                <Calendar className="h-6 w-6 text-blue-500" />
              </div>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50/70 p-4 dark:border-red-900 dark:bg-red-950/20">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-red-700 dark:text-red-300">Urgent queue</p>
                  <p className="text-3xl font-semibold text-foreground">{urgentCount}</p>
                  <p className="text-xs text-red-700/80 dark:text-red-300/80">Critical or high-priority maintenance items</p>
                </div>
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Completed</p>
                  <p className="text-3xl font-semibold text-foreground">{completedCount}</p>
                  <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80">Resolved maintenance issues</p>
                </div>
                <CheckCircle className="h-6 w-6 text-emerald-500" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar — full width */}
      <MaintenanceCalendar />

      {/* Schedule + Issues — side by side */}
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-slate-200/80 shadow-sm dark:border-slate-800">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                Scheduled Maintenance
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={onScheduleMaintenance}>
                Add
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <MaintenanceScheduleList />
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-sm dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-amber-500" />
              Maintenance Issues ({maintenanceData?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MaintenanceIssuesList />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
