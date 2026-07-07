// Operations Overview Tab — quick actions, critical issues, maintenance summary
/**
 * Operations Overview Tab
 * Shows quick actions, critical issues, and maintenance summary
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { safePhotoUrl } from "@/lib/safeUrl";
import {
  ArrowRight,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Wrench
} from "lucide-react";
import type { EnhancedIssue } from "@features/dashboard/hooks/useAdminIssuesData";

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
  criticalIssues: EnhancedIssue[];
  isLoading: boolean;
  onCreateIssue: () => void;
  onScheduleMaintenance: () => void;
  onTabChange: (tab: string) => void;
  onRefresh: () => void;
  onIssueSelect: (issueId: string) => void;
}

export function OperationsOverviewTab({
  enhancedMetrics,
  criticalIssues,
  isLoading,
  onCreateIssue,
  onScheduleMaintenance,
  onTabChange,
  onRefresh,
  onIssueSelect,
}: OperationsOverviewTabProps) {
  const criticalPreview = criticalIssues.slice(0, 5);

  const getPriorityClasses = (priority: string) => {
    switch (String(priority || "").toLowerCase()) {
      case "critical":
      case "urgent":
        return "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/20 dark:text-red-300";
      case "high":
        return "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950/20 dark:text-orange-300";
      case "medium":
        return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300";
      default:
        return "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300";
    }
  };

  const getStatusClasses = (status: string) => {
    switch (String(status || "").toLowerCase()) {
      case "open":
      case "reported":
        return "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/20 dark:text-red-300";
      case "in_progress":
      case "scheduled":
        return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/20 dark:text-blue-300";
      case "resolved":
        return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300";
      default:
        return "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300";
    }
  };

  return (
    <div className="space-y-6">
      {/* The metrics strip and page actions live at the page level (Operations.tsx)
          — this tab used to repeat both in an "Operations snapshot" card, so the
          same four numbers appeared twice on one screen. */}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.8fr_1fr]">
        {/* Critical Issues */}
        <div>
          <Card className="border-slate-200/80 shadow-sm dark:border-slate-800">
            <CardHeader className="flex flex-col gap-4 border-b border-slate-200/80 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
              <CardTitle className="flex items-center gap-2">
                <div className="relative">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  {enhancedMetrics.criticalCount > 0 && (
                    <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
                  )}
                </div>
                Critical queue
                {enhancedMetrics.criticalCount > 0 && (
                  <Badge variant="destructive">{enhancedMetrics.criticalCount}</Badge>
                )}
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onTabChange('issues')}
              >
                View all issues
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
              ) : criticalPreview.length > 0 ? (
                <div className="space-y-3">
                  {criticalPreview.map((issue) => {
                    const photo = safePhotoUrl(issue.photos?.[0]);
                    return (
                      <button
                        key={issue.id}
                        type="button"
                        onClick={() => onIssueSelect(issue.id)}
                        className="w-full rounded-md border border-slate-200 bg-background p-4 text-left transition-colors hover:bg-muted/40 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700"
                      >
                        <div className="flex items-start gap-3">
                          {photo && (
                            <img
                              src={photo}
                              alt="Issue photo"
                              className="h-14 w-20 flex-shrink-0 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                            />
                          )}
                          <div className="min-w-0 flex-1 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline" className={getPriorityClasses(issue.priority)}>
                                {issue.priority.replace("_", " ")}
                              </Badge>
                              <Badge variant="outline" className={getStatusClasses(issue.status)}>
                                {issue.status.replace("_", " ")}
                              </Badge>
                              {issue.rooms?.room_number && (
                                <span className="text-xs text-muted-foreground">
                                  Room {issue.rooms.room_number}
                                </span>
                              )}
                            </div>
                            <div className="space-y-1">
                              <p className="font-medium leading-snug">{issue.title}</p>
                              <p className="line-clamp-2 text-sm text-muted-foreground">{issue.description}</p>
                            </div>
                          </div>
                          <ArrowRight className="mt-1 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                        </div>
                      </button>
                    );
                  })}
                </div>
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

        {/* Sidebar — maintenance pulse */}
        <div>
          <Card className="border-slate-200/80 shadow-sm dark:border-slate-800">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-blue-500" />
                Maintenance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="divide-y divide-border">
                <div className="flex items-center justify-between py-2.5 text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4 text-amber-500" />
                    In progress
                  </span>
                  <span className="font-semibold tabular-nums">{enhancedMetrics.maintenanceInProgress}</span>
                </div>
                <div className="flex items-center justify-between py-2.5 text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    Scheduled
                  </span>
                  <span className="font-semibold tabular-nums">{enhancedMetrics.maintenanceScheduled}</span>
                </div>
                <div className="flex items-center justify-between py-2.5 text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    Resolved today
                  </span>
                  <span className="font-semibold tabular-nums">{enhancedMetrics.resolvedToday}</span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-between !mt-3"
                onClick={() => onTabChange('maintenance')}
              >
                View maintenance
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
