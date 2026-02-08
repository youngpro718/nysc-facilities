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
import { supabase } from "@/lib/supabase";
import { getTypeIcon } from "./utils/iconUtils.tsx";

interface LightingStats {
  functionalPercentage: number;
  byType: {
    type: string;
    total: number;
    functional_count: number;
    needs_maintenance: number;
    non_functional: number;
    needs_replacement: number;
  }[];
}

const isWorkingStatus = (status: string) => {
  return status === 'working' || status === 'functional';
};

const isMaintenanceStatus = (status: string) => {
  return status === 'maintenance' || status === 'maintenance_needed' || status === 'pending_maintenance';
};

const isNonFunctionalStatus = (status: string) => {
  return status === 'not_working' || status === 'non_functional';
};

const isReplacementStatus = (status: string) => {
  return status === 'scheduled_replacement';
};

export const LightingDashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['lighting-stats'],
    queryFn: async () => {
      const { data: fixtures, error } = await supabase
        .from('lighting_fixtures')
        .select('type, status');

      if (error) throw error;

      const fixturesByType = (fixtures || []).reduce((acc: Record<string, unknown[]>, fixture) => {
        if (!acc[fixture.type]) acc[fixture.type] = [];
        acc[fixture.type].push(fixture);
        return acc;
      }, {});

      const totalFixtures = (fixtures || []).length;
      const workingFixtures = (fixtures || []).filter(f => isWorkingStatus(f.status)).length;

      const stats: LightingStats = {
        functionalPercentage: (workingFixtures / totalFixtures) * 100,
        byType: Object.entries(fixturesByType).map(([type, fixtures]: [string, any[]]) => ({
          type,
          total: fixtures.length,
          functional_count: fixtures.filter(f => isWorkingStatus(f.status)).length,
          needs_maintenance: fixtures.filter(f => isMaintenanceStatus(f.status)).length,
          non_functional: fixtures.filter(f => isNonFunctionalStatus(f.status)).length,
          needs_replacement: fixtures.filter(f => isReplacementStatus(f.status)).length
        }))
      };

      return stats;
    }
  });

  if (isLoading || !stats) {
    return <div>Loading...</div>;
  }

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
              <span className="text-sm font-bold">{stats.functionalPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={stats.functionalPercentage} className="h-2" />
          </div>

          {/* Type Breakdown */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-sm font-medium">Fixtures by Type</h3>
            {stats.byType.map((typeStats) => (
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
                <div className="text-sm font-bold">{stats.byType.reduce((sum, row) => sum + row.total, 0)}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-yellow-500" />
              <div className="space-y-0.5">
                <div className="text-xs text-muted-foreground">Need Maintenance</div>
                <div className="text-sm font-bold">{stats.byType.reduce((sum, row) => sum + row.needs_maintenance, 0)}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <div className="space-y-0.5">
                <div className="text-xs text-muted-foreground">Non-Functional</div>
                <div className="text-sm font-bold">{stats.byType.reduce((sum, row) => sum + row.non_functional, 0)}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-purple-500" />
              <div className="space-y-0.5">
                <div className="text-xs text-muted-foreground">Need Replacement</div>
                <div className="text-sm font-bold">{stats.byType.reduce((sum, row) => sum + row.needs_replacement, 0)}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

