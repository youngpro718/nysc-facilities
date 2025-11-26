/**
 * Operations Stats Cards
 * Displays key metrics for operations dashboard
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Wrench,
  Zap
} from "lucide-react";

interface OperationsMetrics {
  activeIssues: number;
  criticalCount: number;
  inProgress: number;
  resolvedToday: number;
  maintenanceInProgress: number;
  maintenanceScheduled: number;
  totalMaintenanceItems: number;
}

interface OperationsStatsCardsProps {
  metrics: OperationsMetrics;
  isLoading: boolean;
}

export function OperationsStatsCards({ metrics, isLoading }: OperationsStatsCardsProps) {
  if (isLoading) {
    return (
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
    );
  }

  return (
    <>
      {/* Main Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Issues</CardTitle>
            <div className="relative">
              <AlertCircle className="h-4 w-4 text-destructive" />
              {metrics.criticalCount > 0 && (
                <div className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeIssues}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{metrics.criticalCount} critical</span>
              {metrics.criticalCount > 0 && (
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
            <div className="text-2xl font-bold">{metrics.inProgress}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Being worked on</span>
              <div className="flex items-center gap-1">
                <Wrench className="h-3 w-3" />
                <span>{metrics.maintenanceInProgress} maintenance</span>
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
            <div className="text-2xl font-bold">{metrics.resolvedToday}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Completed today</span>
              {metrics.resolvedToday > 0 && (
                <TrendingUp className="h-3 w-3 text-green-500" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Maintenance Queue</p>
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{metrics.totalMaintenanceItems}</p>
                <p className="text-xs text-orange-600 dark:text-orange-400">
                  {metrics.maintenanceScheduled} scheduled • {metrics.maintenanceInProgress} active
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
    </>
  );
}
