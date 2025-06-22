
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Lightbulb, AlertTriangle, CheckCircle, Calendar, Battery, Activity } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { LightingIssuesCard } from "./LightingIssuesCard";

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

  const { data: maintenanceData } = useQuery({
    queryKey: ['lighting-maintenance-summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lighting_maintenance_view')
        .select('scheduled_date, status, priority_level')
        .order('scheduled_date', { ascending: true })
        .limit(5);
      
      if (error) throw error;
      return data || [];
    }
  });

  const functionalPercentage = stats ? Math.round((stats.functional_count / (stats.total || 1)) * 100) : 0;
  
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="h-20 bg-muted animate-pulse rounded-md mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-32 bg-muted animate-pulse rounded-md"></div>
          <div className="h-32 bg-muted animate-pulse rounded-md"></div>
          <div className="h-32 bg-muted animate-pulse rounded-md"></div>
        </div>
      </div>
    );
  }

  // Calculate upcoming maintenance count
  const upcomingMaintenance = maintenanceData?.filter(item => 
    item.status === 'scheduled' && 
    new Date(item.scheduled_date) > new Date()
  ).length || 0;
  
  // Calculate high priority maintenance count
  const highPriorityCount = maintenanceData?.filter(item => 
    item.priority_level === 'high'
  ).length || 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Lighting System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-2">
            <div className="flex justify-between items-center">
              <span>System Health</span>
              <span className="font-medium">{functionalPercentage}%</span>
            </div>
            <Progress value={functionalPercentage} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{stats?.functional_count} functional</span>
              <span>{stats?.needs_maintenance} need maintenance</span>
              <span>{stats?.non_functional} non-functional</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Lightbulb className="h-4 w-4 mr-2 text-primary" />
              Functional Fixtures
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold">{stats?.functional_count}</span>
              <span className="text-sm text-muted-foreground">of {stats?.total} total</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2 text-yellow-500" />
              Need Maintenance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold">{stats?.needs_maintenance}</span>
              <span className="text-sm text-muted-foreground">{upcomingMaintenance} scheduled</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Battery className="h-4 w-4 mr-2 text-red-500" />
              Need Replacement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold">{stats?.needs_replacement || 0}</span>
              <span className="text-sm text-muted-foreground">{highPriorityCount} high priority</span>
            </div>
          </CardContent>
        </Card>
        
        <LightingIssuesCard />
      </div>
    </div>
  );
}
