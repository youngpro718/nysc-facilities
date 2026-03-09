
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusCard } from "@/components/ui/StatusCard";
import { Progress } from "@/components/ui/progress";
import { 
  Lightbulb, 
  AlertTriangle, 
  CheckCircle, 
  Wrench,
  MapPin,
  RefreshCw,
  Building,
  Route
} from "lucide-react";
import { supabaseWithRetry } from "@/lib/supabase";
import { fetchLightingFixtures } from "@/services/lightingService";
import { LightStatus } from "@/types/lighting";
import { CreateLightingDialog } from "../../CreateLightingDialog";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function LightingDashboard() {
  const navigate = useNavigate();
  const { data: fixtures, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['lighting-fixtures'],
    queryFn: () => supabaseWithRetry.query(fetchLightingFixtures),
  });
  const [checking, setChecking] = useState(false);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-muted rounded w-3/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Failed to load lighting data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Please try again.</p>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const fixtureStats = (fixtures || []).reduce((acc, fixture) => {
    acc.total++;
    
    if (fixture.space_type === 'room') {
      acc.rooms.total++;
      if (fixture.status === 'functional') acc.rooms.functional++;
    } else if (fixture.space_type === 'hallway') {
      acc.hallways.total++;
      if (fixture.status === 'functional') acc.hallways.functional++;
    }
    
    switch (fixture.status as LightStatus) {
      case 'functional':
        acc.functional++;
        break;
      case 'maintenance_needed':
        acc.maintenance++;
        break;
      case 'non_functional':
        acc.nonFunctional++;
        break;
      case 'scheduled_replacement':
        acc.replacement++;
        break;
    }
    
    return acc;
  }, {
    total: 0,
    functional: 0,
    maintenance: 0,
    nonFunctional: 0,
    replacement: 0,
    rooms: { total: 0, functional: 0 },
    hallways: { total: 0, functional: 0 }
  });

  const functionalPercentage = fixtureStats.total > 0 
    ? Math.round((fixtureStats.functional / fixtureStats.total) * 100) 
    : 0;

  const criticalIssues = fixtureStats.nonFunctional + fixtureStats.replacement;
  const needsAttention = fixtureStats.maintenance;

  const roomHealthPct = fixtureStats.rooms.total > 0
    ? Math.round((fixtureStats.rooms.functional / fixtureStats.rooms.total) * 100)
    : 0;
  const hallwayHealthPct = fixtureStats.hallways.total > 0
    ? Math.round((fixtureStats.hallways.functional / fixtureStats.hallways.total) * 100)
    : 0;

  const getHealthVariant = (pct: number) =>
    pct >= 90 ? "operational" : pct >= 70 ? "warning" : "critical";

  return (
    <div className="space-y-6">
      {/* KPI Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatusCard
          statusVariant={criticalIssues > 0 ? "critical" : "operational"}
          title="Critical Issues"
          value={criticalIssues}
          subLabel="Require immediate attention"
          icon={AlertTriangle}
        />
        <StatusCard
          statusVariant={getHealthVariant(functionalPercentage)}
          title="System Health"
          value={`${functionalPercentage}%`}
          subLabel={`${fixtureStats.functional} of ${fixtureStats.total} functional`}
          icon={CheckCircle}
        />
        <StatusCard
          statusVariant="neutral"
          title="Total Fixtures"
          value={fixtureStats.total}
          subLabel="Across all buildings"
          icon={Lightbulb}
        />
        <StatusCard
          statusVariant={needsAttention > 0 ? "warning" : "operational"}
          title="Maintenance Due"
          value={needsAttention}
          subLabel="Schedule maintenance soon"
          icon={Wrench}
        />
      </div>

      {/* System Health Progress Bar */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-muted-foreground">Overall System Health</p>
            <span className={cn(
              "text-sm font-bold",
              functionalPercentage >= 90 ? "text-status-operational" :
              functionalPercentage >= 70 ? "text-status-warning" :
              "text-status-critical"
            )}>
              {functionalPercentage}%
            </span>
          </div>
          <Progress value={functionalPercentage} className="h-2.5" />
          {(criticalIssues > 0 || needsAttention > 0) && (
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              {fixtureStats.nonFunctional > 0 && (
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-status-critical" />
                  {fixtureStats.nonFunctional} non-functional
                </span>
              )}
              {fixtureStats.replacement > 0 && (
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-status-critical" />
                  {fixtureStats.replacement} need replacement
                </span>
              )}
              {needsAttention > 0 && (
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-status-warning" />
                  {needsAttention} need maintenance
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Room vs Hallway Breakdown — StatusCard style */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className={cn(
          "border-l-[3px]",
          roomHealthPct >= 90 ? "border-l-status-operational" :
          roomHealthPct >= 70 ? "border-l-status-warning" : "border-l-status-critical"
        )}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building className="h-4 w-4 text-muted-foreground" />
              Room Lighting
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-bold">{roomHealthPct}%</span>
                <span className="text-xs text-muted-foreground">
                  {fixtureStats.rooms.functional}/{fixtureStats.rooms.total} functional
                </span>
              </div>
              <Progress value={roomHealthPct} className="h-1.5" />
            </div>
          </CardContent>
        </Card>

        <Card className={cn(
          "border-l-[3px]",
          hallwayHealthPct >= 90 ? "border-l-status-operational" :
          hallwayHealthPct >= 70 ? "border-l-status-warning" : "border-l-status-critical"
        )}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Route className="h-4 w-4 text-muted-foreground" />
              Hallway Lighting
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-bold">{hallwayHealthPct}%</span>
                <span className="text-xs text-muted-foreground">
                  {fixtureStats.hallways.functional}/{fixtureStats.hallways.total} functional
                </span>
              </div>
              <Progress value={hallwayHealthPct} className="h-1.5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions — icon card style */}
      <Card className="border-2 border-dashed border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <CreateLightingDialog 
              onFixtureCreated={() => refetch()}
              onZoneCreated={() => refetch()}
            />
            
            <Button
              variant="outline"
              className="h-16 flex flex-col items-center gap-1 hover:border-primary/50 transition-colors group"
              onClick={() => navigate('/operations?tab=maintenance')}
            >
              <Wrench className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-xs font-medium">Schedule Maintenance</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-16 flex flex-col items-center gap-1 hover:border-primary/50 transition-colors group"
              onClick={() => navigate('/spaces')}
            >
              <MapPin className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-xs font-medium">Manage Rooms</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-16 flex flex-col items-center gap-1 hover:border-primary/50 transition-colors group"
              disabled={checking || isFetching}
              onClick={async () => {
                try {
                  setChecking(true);
                  const result = await refetch();
                  if ((result as any)?.error) {
                    throw (result as any).error;
                  }
                  toast.success('System check complete', { description: 'Fixture data refreshed.' });
                } catch (err) {
                  const message = err instanceof Error ? err.message : 'Unable to refresh fixtures. Please try again.';
                  toast.error('System check failed', { description: message });
                } finally {
                  setChecking(false);
                }
              }}
            >
              <RefreshCw className={cn("h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors", (checking || isFetching) && "animate-spin")} />
              <span className="text-xs font-medium">{checking || isFetching ? 'Checking…' : 'System Check'}</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-16 flex flex-col items-center gap-1 hover:border-primary/50 transition-colors group"
              onClick={() => navigate('/operations?tab=issues')}
            >
              <AlertTriangle className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-xs font-medium">View Issues</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
