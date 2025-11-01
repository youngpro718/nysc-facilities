import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, User, Clock } from "lucide-react";

interface ActivityItem {
  id: string;
  type: 'user_login' | 'system_update' | 'issue_created' | 'maintenance';
  description: string;
  timestamp: string;
  user?: string;
}

interface RecentActivityWidgetProps {
  activities?: ActivityItem[];
}

export function RecentActivityWidget({ activities }: RecentActivityWidgetProps) {
  // Default activities for demo purposes
  const defaultActivities: ActivityItem[] = [
    {
      id: '1',
      type: 'user_login',
      description: 'User logged in from mobile device',
      timestamp: '2 minutes ago',
      user: 'John Doe'
    },
    {
      id: '2',
      type: 'issue_created',
      description: 'New maintenance issue reported',
      timestamp: '15 minutes ago',
      user: 'Jane Smith'
    },
    {
      id: '3',
      type: 'system_update',
      description: 'System backup completed successfully',
      timestamp: '1 hour ago'
    },
    {
      id: '4',
      type: 'maintenance',
      description: 'Scheduled maintenance completed',
      timestamp: '2 hours ago'
    }
  ];

  const activityData = activities || defaultActivities;

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_login': return <User className="h-4 w-4" />;
      case 'system_update': return <Activity className="h-4 w-4" />;
      case 'issue_created': return <Activity className="h-4 w-4" />;
      case 'maintenance': return <Activity className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityBadge = (type: string) => {
    switch (type) {
      case 'user_login': return <Badge variant="outline">Login</Badge>;
      case 'system_update': return <Badge variant="default">System</Badge>;
      case 'issue_created': return <Badge variant="destructive">Issue</Badge>;
      case 'maintenance': return <Badge variant="secondary">Maintenance</Badge>;
      default: return <Badge variant="outline">Activity</Badge>;
    }
  };

  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent System Activity
          </h2>
          <Badge variant="outline">Live</Badge>
        </div>
        
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {activityData.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 p-2 bg-muted rounded-lg">
              <div className="flex-shrink-0 mt-0.5">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.description}</p>
                    {activity.user && (
                      <p className="text-xs text-muted-foreground">by {activity.user}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {getActivityBadge(activity.type)}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {activity.timestamp}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}