import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { Lightbulb, AlertTriangle, Wrench, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

interface LightingSystemStats {
  total_fixtures: number;
  functional: number;
  non_functional: number;
  maintenance_needed: number;
  critical_issues: number;
}

export function LightingSummaryCard() {
  const navigate = useNavigate();

  const { data: stats, isLoading } = useQuery<LightingSystemStats>({
    queryKey: ['lighting-system-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lighting_fixtures')
        .select('status, ballast_issue');
      
      if (error) throw error;

      const stats = {
        total_fixtures: data.length,
        functional: data.filter(f => f.status === 'functional').length,
        non_functional: data.filter(f => f.status === 'non_functional').length,
        maintenance_needed: data.filter(f => f.status === 'maintenance_needed').length,
        critical_issues: data.filter(f => f.ballast_issue || f.status === 'non_functional').length,
      };

      return stats;
    },
  });

  if (isLoading) {
    return (
      <Card className="h-[200px]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Lighting System</CardTitle>
          <Lightbulb className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-20 mb-2" />
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-3/4 mb-4" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    );
  }

  const healthPercentage = stats ? Math.round((stats.functional / stats.total_fixtures) * 100) : 0;
  const needsAttention = stats ? stats.non_functional + stats.maintenance_needed : 0;

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Lighting System</CardTitle>
        <Lightbulb className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <div className="text-2xl font-bold">{healthPercentage}%</div>
            <p className="text-xs text-muted-foreground">System Health</p>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>{stats?.functional || 0} Working</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <span>{stats?.non_functional || 0} Down</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-yellow-500 rounded-full" />
              <span>{stats?.maintenance_needed || 0} Maintenance</span>
            </div>
            <div className="flex items-center gap-1">
              <AlertTriangle className="w-2 h-2 text-orange-500" />
              <span>{stats?.critical_issues || 0} Critical</span>
            </div>
          </div>

          {needsAttention > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-md p-2">
              <div className="flex items-center gap-1 text-orange-700">
                <Wrench className="h-3 w-3" />
                <span className="text-xs font-medium">
                  {needsAttention} fixtures need attention
                </span>
              </div>
            </div>
          )}

          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => navigate('/lighting')}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Manage Lighting
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}