import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  AlertTriangle, 
  Wrench, 
  Clock, 
  TrendingUp,
  Activity,
  Calendar,
  Eye,
  AlertCircle
} from "lucide-react";
import { useState } from "react";

interface DashboardStats {
  total_fixtures: number;
  working_fixtures: number;
  maintenance_needed: number;
  non_functional: number;
  issues_open: number;
  issues_overdue: number;
  avg_resolution_time: number;
  maintenance_due_this_week: number;
}

export function EnhancedDashboard() {
  const [alertsOpen, setAlertsOpen] = useState(false);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['lighting-dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      // Get fixtures data
      const { data: fixtures, error: fixturesError } = await supabase
        .from('lighting_fixtures')
        .select('id, status, created_at');

      if (fixturesError) throw fixturesError;

      // Get issues data  
      const { data: issues, error: issuesError } = await supabase
        .from('lighting_issues')
        .select('id, status, reported_at, resolved_at');

      if (issuesError) throw issuesError;

      const now = new Date();
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const working = fixtures?.filter(f => f.status === 'functional').length || 0;
      const maintenance = fixtures?.filter(f => f.status === 'maintenance_needed').length || 0;
      const nonFunctional = fixtures?.filter(f => f.status === 'non_functional').length || 0;
      
      const openIssues = issues?.filter(i => i.status === 'open' || i.status === 'in_progress').length || 0;
      const overdueIssues = issues?.filter(i => {
        if (i.status === 'resolved') return false;
        const reportedDate = new Date(i.reported_at);
        const daysDiff = (now.getTime() - reportedDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff > 7; // Consider overdue after 7 days
      }).length || 0;

      // Calculate average resolution time
      const resolvedIssues = issues?.filter(i => i.status === 'resolved' && i.resolved_at) || [];
      const avgResolution = resolvedIssues.length > 0 
        ? resolvedIssues.reduce((sum, issue) => {
            const reported = new Date(issue.reported_at);
            const resolved = new Date(issue.resolved_at!);
            return sum + (resolved.getTime() - reported.getTime()) / (1000 * 60 * 60 * 24);
          }, 0) / resolvedIssues.length 
        : 0;

      return {
        total_fixtures: fixtures?.length || 0,
        working_fixtures: working,
        maintenance_needed: maintenance,
        non_functional: nonFunctional,
        issues_open: openIssues,
        issues_overdue: overdueIssues,
        avg_resolution_time: Math.round(avgResolution * 10) / 10,
        maintenance_due_this_week: Math.floor(Math.random() * 5) // Placeholder
      };
    }
  });

  if (isLoading) {
    return <div className="animate-pulse space-y-4">
      {Array.from({length: 4}).map((_, i) => (
        <div key={i} className="h-32 bg-muted rounded-lg" />
      ))}
    </div>;
  }

  const functionalPercentage = stats ? (stats.working_fixtures / stats.total_fixtures) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Critical Alerts */}
      {stats && (stats.issues_overdue > 0 || stats.non_functional > 5) && (
        <Card className="border-destructive">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Critical Alerts
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setAlertsOpen(!alertsOpen)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {alertsOpen ? 'Hide' : 'View'} Details
              </Button>
            </div>
          </CardHeader>
          {alertsOpen && (
            <CardContent>
              <div className="space-y-2 text-sm">
                {stats.issues_overdue > 0 && (
                  <div className="flex items-center gap-2 text-destructive">
                    <Clock className="h-4 w-4" />
                    {stats.issues_overdue} issues overdue for resolution (&gt;7 days)
                  </div>
                )}
                {stats.non_functional > 5 && (
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    {stats.non_functional} fixtures non-functional - immediate attention required
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold">{functionalPercentage.toFixed(1)}%</span>
              <Activity className="h-5 w-5 text-green-500" />
            </div>
            <Progress value={functionalPercentage} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {stats?.working_fixtures}/{stats?.total_fixtures} fixtures operational
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold text-yellow-600">{stats?.issues_open || 0}</span>
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={stats && stats.issues_overdue > 0 ? "destructive" : "secondary"} className="text-xs">
                {stats?.issues_overdue || 0} overdue
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Maintenance Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold text-orange-600">{stats?.maintenance_needed || 0}</span>
              <Wrench className="h-5 w-5 text-orange-500" />
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.maintenance_due_this_week || 0} due this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold">{stats?.avg_resolution_time || 0}</span>
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-xs text-muted-foreground">
              days avg. resolution
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm">Issue resolved in Room 1045</span>
              </div>
              <span className="text-xs text-muted-foreground">2h ago</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-yellow-500" />
                <span className="text-sm">Maintenance scheduled for Floor 10</span>
              </div>
              <span className="text-xs text-muted-foreground">4h ago</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-red-500" />
                <span className="text-sm">Critical issue reported in Room 1001</span>
              </div>
              <span className="text-xs text-muted-foreground">6h ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}