import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Lightbulb, 
  AlertTriangle, 
  CheckCircle, 
  Wrench,
  TrendingUp,
  MapPin,
  Plus,
  RefreshCw
} from "lucide-react";
import { fetchLightingFixtures } from "@/services/supabase";
import { LightStatus } from "@/types/lighting";
import { CreateLightingDialog } from "../../CreateLightingDialog";

export function LightingDashboard() {
  const { data: fixtures, isLoading, refetch } = useQuery({
    queryKey: ['lighting-fixtures'],
    queryFn: fetchLightingFixtures,
  });

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

  const fixtureStats = fixtures?.reduce((acc, fixture) => {
    acc.total++;
    
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
    replacement: 0
  }) || { total: 0, functional: 0, maintenance: 0, nonFunctional: 0, replacement: 0 };

  const functionalPercentage = fixtureStats.total > 0 
    ? Math.round((fixtureStats.functional / fixtureStats.total) * 100) 
    : 0;

  const criticalIssues = fixtureStats.nonFunctional + fixtureStats.replacement;
  const needsAttention = fixtureStats.maintenance;

  return (
    <div className="space-y-6">
      {/* Quick Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fixtures</CardTitle>
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fixtureStats.total}</div>
            <p className="text-xs text-muted-foreground">
              Across all buildings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {functionalPercentage}%
              {functionalPercentage >= 90 ? (
                <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                  Excellent
                </Badge>
              ) : functionalPercentage >= 75 ? (
                <Badge variant="secondary">Good</Badge>
              ) : (
                <Badge variant="destructive">Needs Attention</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {fixtureStats.functional} of {fixtureStats.total} functional
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{criticalIssues}</div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance Due</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{needsAttention}</div>
            <p className="text-xs text-muted-foreground">
              Schedule maintenance soon
            </p>
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
            
            <Button variant="outline" className="justify-start gap-2">
              <Wrench className="h-4 w-4" />
              Schedule Maintenance
            </Button>
            
            <Button variant="outline" className="justify-start gap-2">
              <MapPin className="h-4 w-4" />
              Manage Rooms
            </Button>
            
            <Button variant="outline" className="justify-start gap-2">
              <RefreshCw className="h-4 w-4" />
              System Check
            </Button>
            
            <Button variant="outline" className="justify-start gap-2">
              <AlertTriangle className="h-4 w-4" />
              View All Issues
            </Button>
            
            <Button variant="outline" className="justify-start gap-2">
              <TrendingUp className="h-4 w-4" />
              Energy Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Status Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Fixture Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">Functional</span>
              </div>
              <span className="font-medium">{fixtureStats.functional}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm">Needs Maintenance</span>
              </div>
              <span className="font-medium">{fixtureStats.maintenance}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm">Non-Functional</span>
              </div>
              <span className="font-medium">{fixtureStats.nonFunctional}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-sm">Needs Replacement</span>
              </div>
              <span className="font-medium">{fixtureStats.replacement}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              {fixtureStats.total === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No fixtures in system yet
                </p>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>System dashboard loaded</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-blue-500" />
                    <span>{fixtureStats.total} fixtures monitored</span>
                  </div>
                  {criticalIssues > 0 && (
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span>{criticalIssues} critical issues detected</span>
                    </div>
                  )}
                  {needsAttention > 0 && (
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-yellow-500" />
                      <span>{needsAttention} fixtures need maintenance</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}