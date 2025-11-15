import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building, Activity, AlertTriangle } from "lucide-react";

interface BuildingStatusWidgetProps {
  buildingStats?: {
    totalBuildings: number;
    activeBuildings: number;
    maintenanceIssues: number;
  };
}

export function BuildingStatusWidget({ buildingStats }: BuildingStatusWidgetProps) {
  // Default stats for demo purposes
  const stats = buildingStats || {
    totalBuildings: 12,
    activeBuildings: 11,
    maintenanceIssues: 3
  };

  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <Building className="h-5 w-5" />
            Building Status
          </h2>
          <Badge variant={stats.maintenanceIssues > 0 ? 'destructive' : 'default'}>
            {stats.activeBuildings}/{stats.totalBuildings} Active
          </Badge>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-muted rounded-lg">
            <div className="text-lg font-bold text-primary">{stats.totalBuildings}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="text-center p-2 bg-muted rounded-lg">
            <div className="text-lg font-bold text-green-500">{stats.activeBuildings}</div>
            <div className="text-xs text-muted-foreground">Active</div>
          </div>
          <div className="text-center p-2 bg-muted rounded-lg">
            <div className="text-lg font-bold text-orange-500">{stats.maintenanceIssues}</div>
            <div className="text-xs text-muted-foreground">Issues</div>
          </div>
        </div>
      </div>
    </Card>
  );
}