import { X, TrendingUp, TrendingDown, Clock, AlertTriangle, CheckCircle, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { IssueStats } from "@/hooks/dashboard/useAdminIssuesData";
interface IssueAnalyticsPanelProps {
  stats: IssueStats;
  onClose: () => void;
}
export function IssueAnalyticsPanel({
  stats,
  onClose
}: IssueAnalyticsPanelProps) {
  const resolutionRate = stats.total > 0 ? (stats.resolved / stats.total * 100).toFixed(1) : '0';
  const criticalRate = stats.total > 0 ? (stats.critical / stats.total * 100).toFixed(1) : '0';
  return <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Issues Analytics</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Total Issues */}
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {stats.total}
            </div>
            <div className="text-sm text-muted-foreground">Total Issues</div>
          </div>

          {/* Resolution Rate */}
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {resolutionRate}%
            </div>
            <div className="text-sm text-muted-foreground">Resolution Rate</div>
          </div>

          {/* Critical Issues */}
          <div className="text-center">
            <div className="text-2xl font-bold text-destructive">
              {stats.critical}
            </div>
            <div className="text-sm text-muted-foreground">Critical Issues</div>
          </div>

          {/* Rooms Affected */}
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.roomsWithIssues}
            </div>
            <div className="text-sm text-muted-foreground">Rooms Affected</div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Status Breakdown */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Status Breakdown
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <Badge variant="destructive" className="min-w-fit px-2 py-1 text-xs font-medium">Open</Badge>
                  <span className="text-sm font-medium">{stats.open} issues</span>
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  {stats.total > 0 ? (stats.open / stats.total * 100).toFixed(0) : 0}%
                </div>
              </div>
              
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <Badge className="min-w-fit px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 border-blue-200 dark:border-blue-800 hover:bg-blue-200">In Progress</Badge>
                  <span className="text-sm font-medium">{stats.in_progress} issues</span>
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  {stats.total > 0 ? (stats.in_progress / stats.total * 100).toFixed(0) : 0}%
                </div>
              </div>
              
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <Badge className="min-w-fit px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 border-green-200 dark:border-green-800 hover:bg-green-200">Resolved</Badge>
                  <span className="text-sm font-medium">{stats.resolved} issues</span>
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  {stats.total > 0 ? (stats.resolved / stats.total * 100).toFixed(0) : 0}%
                </div>
              </div>
            </div>
          </div>

          {/* Priority Breakdown */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Priority Breakdown
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <Badge variant="destructive" className="min-w-fit px-2 py-1 text-xs font-medium">High</Badge>
                  <span className="text-sm font-medium">{stats.high} issues</span>
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  {stats.total > 0 ? (stats.high / stats.total * 100).toFixed(0) : 0}%
                </div>
              </div>
              
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <Badge className="min-w-fit px-2 py-1 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 border-yellow-200 dark:border-yellow-800 hover:bg-yellow-200">Medium</Badge>
                  <span className="text-sm font-medium">{stats.medium} issues</span>
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  {stats.total > 0 ? (stats.medium / stats.total * 100).toFixed(0) : 0}%
                </div>
              </div>
              
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="min-w-fit px-2 py-1 text-xs font-medium">Low</Badge>
                  <span className="text-sm font-medium">{stats.low} issues</span>
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  {stats.total > 0 ? (stats.low / stats.total * 100).toFixed(0) : 0}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-6">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Recent Activity
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Today:</span>
              <span className="font-medium">{stats.todayReported} reported</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">This Week:</span>
              <span className="font-medium">{stats.weekReported} reported</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>;
}