/**
 * RecentActivityWidget - Shows recent user activity
 */

import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  Package, 
  Key, 
  AlertTriangle,
  Clock,
  CheckCircle,
  ArrowRight
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface ActivityItem {
  id: string;
  type: 'supply_request' | 'key_request' | 'issue' | 'notification';
  title: string;
  status: string;
  timestamp: string;
  path?: string;
}

interface RecentActivityWidgetProps {
  activities: ActivityItem[];
  maxItems?: number;
  showViewAll?: boolean;
  viewAllPath?: string;
  className?: string;
}

const typeConfig = {
  supply_request: { icon: Package, color: 'text-green-600', label: 'Supply' },
  key_request: { icon: Key, color: 'text-blue-600', label: 'Key' },
  issue: { icon: AlertTriangle, color: 'text-orange-600', label: 'Issue' },
  notification: { icon: Activity, color: 'text-purple-600', label: 'Update' },
};

const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', icon: any }> = {
  pending: { variant: 'secondary', icon: Clock },
  approved: { variant: 'default', icon: CheckCircle },
  in_progress: { variant: 'secondary', icon: Clock },
  completed: { variant: 'outline', icon: CheckCircle },
  rejected: { variant: 'destructive', icon: AlertTriangle },
  open: { variant: 'destructive', icon: AlertTriangle },
  resolved: { variant: 'outline', icon: CheckCircle },
};

export function RecentActivityWidget({ 
  activities, 
  maxItems = 5,
  showViewAll = true,
  viewAllPath = '/my-activity',
  className 
}: RecentActivityWidgetProps) {
  const navigate = useNavigate();
  const displayedActivities = activities.slice(0, maxItems);

  if (activities.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No recent activity</p>
            <p className="text-sm mt-1">Your requests and issues will appear here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
        {showViewAll && (
          <Button variant="ghost" size="sm" onClick={() => navigate(viewAllPath)}>
            View All
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayedActivities.map((activity) => {
            const typeInfo = typeConfig[activity.type];
            const statusInfo = statusConfig[activity.status] || statusConfig.pending;
            const Icon = typeInfo.icon;
            const StatusIcon = statusInfo.icon;

            return (
              <div 
                key={activity.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors",
                  activity.path && "cursor-pointer"
                )}
                onClick={() => activity.path && navigate(activity.path)}
              >
                <div className={cn("p-2 rounded-full bg-muted", typeInfo.color)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      {typeInfo.label}
                    </span>
                    <Badge variant={statusInfo.variant} className="text-xs gap-1">
                      <StatusIcon className="h-3 w-3" />
                      {activity.status}
                    </Badge>
                  </div>
                  <p className="font-medium truncate">{activity.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
