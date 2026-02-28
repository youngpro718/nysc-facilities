
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusCard } from "@/components/ui/StatusCard";
import { 
  Lightbulb, 
  AlertTriangle, 
  CheckCircle, 
  Wrench,
  TrendingUp,
  MapPin,
  Plus,
  RefreshCw,
  Building,
  Route
} from "lucide-react";
import { fetchLightingFixtures, supabaseWithRetry } from "@/lib/supabase";
import { LightStatus } from "@/types/lighting";
import { CreateLightingDialog } from "../../CreateLightingDialog";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

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
    
    // Track by space type
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
  }) || { 
    total: 0, functional: 0, maintenance: 0, nonFunctional: 0, replacement: 0,
    rooms: { total: 0, functional: 0 },
    hallways: { total: 0, functional: 0 }
  };

  const functionalPercentage = fixtureStats.total > 0 
    ? Math.round((fixtureStats.functional / fixtureStats.total) * 100) 
    : 0;

  const criticalIssues = fixtureStats.nonFunctional + fixtureStats.replacement;
  const needsAttention = fixtureStats.maintenance;

  return (
    <div className="space-y-6">
      {/* Quick Stats Grid — reordered: Critical first */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatusCard
          statusVariant={criticalIssues > 0 ? "critical" : "operational"}
          title="Critical Issues"
          value={criticalIssues}
          subLabel="Require immediate attention"
          icon={AlertTriangle}
        />
        <StatusCard
          statusVariant={functionalPercentage >= 90 ? "operational" : functionalPercentage >= 75 ? "warning" : "critical"}
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

      {/* Room vs Hallway Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Room Lighting
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Fixtures</span>
                <span className="font-semibold">{fixtureStats.rooms.total}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Functional</span>
                <span className="font-semibold text-green-600 dark:text-green-400">{fixtureStats.rooms.functional}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Health Rate</span>
                <span className="font-semibold">
                  {fixtureStats.rooms.total > 0 
                    ? Math.round((fixtureStats.rooms.functional / fixtureStats.rooms.total) * 100) 
                    : 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Route className="h-5 w-5" />
              Hallway Lighting
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Fixtures</span>
                <span className="font-semibold">{fixtureStats.hallways.total}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Functional</span>
                <span className="font-semibold text-green-600 dark:text-green-400">{fixtureStats.hallways.functional}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Health Rate</span>
                <span className="font-semibold">
                  {fixtureStats.hallways.total > 0 
                    ? Math.round((fixtureStats.hallways.functional / fixtureStats.hallways.total) * 100) 
                    : 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <CreateLightingDialog 
              onFixtureCreated={() => refetch()}
              onZoneCreated={() => refetch()}
            />
            
            <Button
              variant="outline"
              className="justify-start gap-2"
              onClick={() => navigate('/operations?tab=maintenance')}
            >
              <Wrench className="h-4 w-4" />
              Schedule Maintenance
            </Button>
            
            <Button
              variant="outline"
              className="justify-start gap-2"
              onClick={() => navigate('/spaces')}
            >
              <MapPin className="h-4 w-4" />
              Manage Rooms
            </Button>
            
            <Button
              variant="outline"
              className="justify-start gap-2"
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
              <RefreshCw className="h-4 w-4" />
              {checking || isFetching ? 'Checking…' : 'System Check'}
            </Button>
            
            <Button
              variant="outline"
              className="justify-start gap-2"
              onClick={() => navigate('/operations?tab=issues')}
            >
              <AlertTriangle className="h-4 w-4" />
              View Issues
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}