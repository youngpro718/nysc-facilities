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
            <div className="text-2xl font-bold text-green-600">
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
            <div className="text-2xl font-bold text-blue-600">
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="w-12 text-xs">Open</Badge>
                  <span className="text-sm">{stats.open} issues</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {stats.total > 0 ? (stats.open / stats.total * 100).toFixed(0) : 0}%
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="w-12 text-xs bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200">Progress</Badge>
                  <span className="text-sm">{stats.in_progress} issues</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {stats.total > 0 ? (stats.in_progress / stats.total * 100).toFixed(0) : 0}%
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="w-12 text-xs bg-green-100 text-green-800 border-green-200 hover:bg-green-200">Resolved</Badge>
                  <span className="text-sm">{stats.resolved} issues</span>
                </div>
                <div className="text-sm text-muted-foreground">
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="w-12 text-xs">High</Badge>
                  <span className="text-sm">{stats.high} issues</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {stats.total > 0 ? (stats.high / stats.total * 100).toFixed(0) : 0}%
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="w-12 text-xs bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200">Medium</Badge>
                  <span className="text-sm">{stats.medium} issues</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {stats.total > 0 ? (stats.medium / stats.total * 100).toFixed(0) : 0}%
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="w-12 text-xs">Low</Badge>
                  <span className="text-sm">{stats.low} issues</span>
                </div>
                <div className="text-sm text-muted-foreground">
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