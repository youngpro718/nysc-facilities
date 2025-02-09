
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Lightbulb, 
  AlertTriangle, 
  Clock, 
  Wrench,
  Calendar,
  Activity,
  Battery,
  AlertCircle,
  Radar,
  ShieldAlert
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const LightingDashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['lighting-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lighting_fixture_stats')
        .select('*');
      
      if (error) throw error;
      
      // Transform data into aggregated stats
      const totals = {
        totalFixtures: data.reduce((sum, row) => sum + row.total, 0),
        functional: data.reduce((sum, row) => sum + row.functional_count, 0),
        needsMaintenance: data.reduce((sum, row) => sum + row.needs_maintenance, 0),
        nonFunctional: data.reduce((sum, row) => sum + row.non_functional, 0),
        needsReplacement: data.reduce((sum, row) => sum + row.needs_replacement, 0),
      };

      return {
        byType: data,
        totals,
        functionalPercentage: (totals.functional / totals.totalFixtures) * 100,
      };
    }
  });

  if (isLoading) {
    return <div>Loading statistics...</div>;
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'emergency':
        return <ShieldAlert className="h-4 w-4 text-red-500" />;
      case 'motion_sensor':
        return <Radar className="h-4 w-4 text-blue-500" />;
      default:
        return <Lightbulb className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Lighting System Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Status */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Functional Status</span>
              </div>
              <span className="text-sm font-bold">{stats?.functionalPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={stats?.functionalPercentage} className="h-2" />
          </div>

          {/* Type Breakdown */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-sm font-medium">Fixtures by Type</h3>
            {stats?.byType.map((typeStats) => (
              <div key={typeStats.type} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(typeStats.type)}
                    <span className="text-sm capitalize">{typeStats.type.replace('_', ' ')}</span>
                  </div>
                  <span className="text-sm font-bold">{typeStats.total}</span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span>{typeStats.functional_count} OK</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                    <span>{typeStats.needs_maintenance} Maintenance</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-red-500"></div>
                    <span>{typeStats.non_functional} Down</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                    <span>{typeStats.needs_replacement} Replace</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t pt-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-500" />
              <div className="space-y-0.5">
                <div className="text-xs text-muted-foreground">Total Fixtures</div>
                <div className="text-sm font-bold">{stats?.totals.totalFixtures}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-yellow-500" />
              <div className="space-y-0.5">
                <div className="text-xs text-muted-foreground">Need Maintenance</div>
                <div className="text-sm font-bold">{stats?.totals.needsMaintenance}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <div className="space-y-0.5">
                <div className="text-xs text-muted-foreground">Non-Functional</div>
                <div className="text-sm font-bold">{stats?.totals.nonFunctional}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-purple-500" />
              <div className="space-y-0.5">
                <div className="text-xs text-muted-foreground">Need Replacement</div>
                <div className="text-sm font-bold">{stats?.totals.needsReplacement}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

