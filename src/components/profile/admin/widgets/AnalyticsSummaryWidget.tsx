import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, Clock } from "lucide-react";

interface AnalyticsSummaryWidgetProps {
  analyticsData?: {
    dailyActiveUsers: number;
    weeklyGrowth: number;
    systemUptime: string;
  };
}

export function AnalyticsSummaryWidget({ analyticsData }: AnalyticsSummaryWidgetProps) {
  // Default analytics for demo purposes
  const data = analyticsData || {
    dailyActiveUsers: 247,
    weeklyGrowth: 12.5,
    systemUptime: "99.8%"
  };

  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Analytics Summary
          </h2>
          <Badge variant="outline">
            <TrendingUp className="h-3 w-3 mr-1" />
            +{data.weeklyGrowth}%
          </Badge>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-muted rounded-lg">
            <div className="text-lg font-bold text-primary">{data.dailyActiveUsers}</div>
            <div className="text-xs text-muted-foreground">Daily Users</div>
          </div>
          <div className="text-center p-2 bg-muted rounded-lg">
            <div className="text-lg font-bold text-green-500">+{data.weeklyGrowth}%</div>
            <div className="text-xs text-muted-foreground">Growth</div>
          </div>
          <div className="text-center p-2 bg-muted rounded-lg">
            <div className="text-lg font-bold text-blue-500 flex items-center justify-center gap-1">
              <Clock className="h-3 w-3" />
              {data.systemUptime}
            </div>
            <div className="text-xs text-muted-foreground">Uptime</div>
          </div>
        </div>
      </div>
    </Card>
  );
}