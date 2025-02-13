
import { RoomHealthMetrics as RoomHealthMetricsType } from "../types/IssueTypes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ClipboardList, AlertTriangle, Clock, Calendar } from "lucide-react";

interface RoomHealthMetricsProps {
  metrics: RoomHealthMetricsType;
}

export function RoomHealthMetrics({ metrics }: RoomHealthMetricsProps) {
  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    if (score >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Room Health Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Health Score</span>
              <span className="text-sm font-medium">{metrics.health_score}%</span>
            </div>
            <Progress 
              value={metrics.health_score} 
              className={getHealthScoreColor(metrics.health_score)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                <span className="text-sm font-medium">Open Issues</span>
              </div>
              <p className="text-2xl font-bold">{metrics.open_issues_count}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium">Critical Issues</span>
              </div>
              <p className="text-2xl font-bold">{metrics.critical_issues_count}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">Avg. Resolution Time</span>
              </div>
              <Badge variant="secondary">
                {metrics.avg_resolution_time}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="text-sm font-medium">Next Maintenance Due</span>
              </div>
              {metrics.next_maintenance_due ? (
                <Badge variant="outline">
                  {format(new Date(metrics.next_maintenance_due), 'MMM d, yyyy')}
                </Badge>
              ) : (
                <Badge variant="outline">Not scheduled</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
