import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";

interface SystemOverviewWidgetProps {
  stats: {
    totalUsers: number;
    activeIssues: number;
    systemHealth: 'good' | 'warning' | 'error';
  };
}

export function SystemOverviewWidget({ stats }: SystemOverviewWidgetProps) {
  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">System Overview</h2>
          <Badge 
            variant={stats.systemHealth === 'good' ? 'default' : 'destructive'}
            className="flex items-center gap-1"
          >
            <CheckCircle2 className="h-3 w-3" />
            {stats.systemHealth === 'good' ? 'Healthy' : 'Issues'}
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-primary">{stats.totalUsers}</div>
            <div className="text-xs text-muted-foreground">Total Users</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-orange-500">{stats.activeIssues}</div>
            <div className="text-xs text-muted-foreground">Active Issues</div>
          </div>
        </div>
      </div>
    </Card>
  );
}