import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { Lightbulb, AlertTriangle, CheckCircle, Zap, Wrench, Plus } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { LightingIssuesCard } from "./LightingIssuesCard";
import { FloorHealthMap } from "./FloorHealthMap";
import { FixtureStatusIcon } from "../components/FixtureStatusIcon";
import { cn } from "@/lib/utils";

export function LightingDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['lighting-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lighting_fixture_stats')
        .select('*')
        .single();
      
      if (error) throw error;
      return data || {
        total: 0,
        functional_count: 0,
        needs_maintenance: 0,
        non_functional: 0,
        needs_replacement: 0
      };
    }
  });

  const { data: recentActivity } = useQuery({
    queryKey: ['lighting-recent-activity'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lighting_fixtures')
        .select('id, name, status, updated_at')
        .order('updated_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data || [];
    }
  });

  const functionalPercentage = stats ? Math.round((stats.functional_count / (stats.total || 1)) * 100) : 0;
  const healthStatus = functionalPercentage >= 90 ? 'excellent' : functionalPercentage >= 70 ? 'good' : functionalPercentage >= 50 ? 'fair' : 'poor';
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-muted animate-pulse rounded-xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Health Card */}
      <Card className="border-none shadow-lg bg-gradient-to-br from-card to-muted/30">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
            {/* Health Ring */}
            <div className="relative flex-shrink-0">
              <div className={cn(
                "w-32 h-32 rounded-full flex items-center justify-center",
                "border-4 transition-colors",
                healthStatus === 'excellent' ? "border-emerald-500 bg-emerald-500/10" :
                healthStatus === 'good' ? "border-green-500 bg-green-500/10" :
                healthStatus === 'fair' ? "border-amber-500 bg-amber-500/10" :
                "border-destructive bg-destructive/10"
              )}>
                <div className="text-center">
                  <span className={cn(
                    "text-4xl font-bold",
                    healthStatus === 'excellent' ? "text-emerald-500" :
                    healthStatus === 'good' ? "text-green-500" :
                    healthStatus === 'fair' ? "text-amber-500" :
                    "text-destructive"
                  )}>
                    {functionalPercentage}%
                  </span>
                  <p className="text-xs text-muted-foreground font-medium">System Health</p>
                </div>
              </div>
              {healthStatus === 'excellent' && (
                <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-pulse" />
              )}
            </div>

            {/* Stats Summary */}
            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Lighting System Overview</h2>
                  <p className="text-muted-foreground text-sm">
                    {stats?.total || 0} total fixtures • {stats?.functional_count || 0} operational
                  </p>
                </div>
                <Button size="sm" className="gap-2" onClick={() => {
                  const btn = document.querySelector('[data-testid="create-lighting-button"]');
                  if (btn) (btn as HTMLElement).click();
                }}>
                  <Plus className="h-4 w-4" />
                  Add Fixture
                </Button>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                  <div>
                    <p className="text-lg font-semibold">{stats?.functional_count || 0}</p>
                    <p className="text-xs text-muted-foreground">Working</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <Wrench className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="text-lg font-semibold">{stats?.needs_maintenance || 0}</p>
                    <p className="text-xs text-muted-foreground">Maintenance</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <div>
                    <p className="text-lg font-semibold">{stats?.non_functional || 0}</p>
                    <p className="text-xs text-muted-foreground">Not Working</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Secondary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Floor Health Map */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Floor Health Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FloorHealthMap />
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivity?.slice(0, 4).map((fixture) => (
              <div key={fixture.id} className="flex items-center gap-3">
                <FixtureStatusIcon status={fixture.status} size="sm" showGlow={false} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{fixture.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(fixture.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
            {(!recentActivity || recentActivity.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recent activity
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Issues Card */}
      <LightingIssuesCard />
    </div>
  );
}
