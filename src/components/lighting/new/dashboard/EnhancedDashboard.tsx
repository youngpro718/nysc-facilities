import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { 
  Lightbulb, 
  AlertTriangle, 
  CheckCircle, 
  Calendar, 
  Battery, 
  Activity,
  TrendingUp,
  Clock,
  Zap
} from "lucide-react";
import { QuickActionsPanel } from "../quick-actions/QuickActionsPanel";
import { LightingAlert } from "../types";

export function EnhancedDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['enhanced-lighting-stats'],
    queryFn: async () => {
      const { data: fixtures, error } = await supabase
        .from('lighting_fixtures')
        .select('id, status, technology, requires_electrician, reported_out_date, replaced_date, type');
      
      if (error) throw error;
      
      const total = fixtures?.length || 0;
      const functional = fixtures?.filter(f => f.status === 'functional').length || 0;
      const needsMaintenance = fixtures?.filter(f => f.status === 'maintenance_needed').length || 0;
      const nonFunctional = fixtures?.filter(f => f.status === 'non_functional').length || 0;
      const needsElectrician = fixtures?.filter(f => f.requires_electrician).length || 0;
      const emergency = fixtures?.filter(f => f.type === 'emergency').length || 0;
      const ledCount = fixtures?.filter(f => f.technology === 'LED').length || 0;
      
      // Calculate current outages (reported but not fixed)
      const currentOutages = fixtures?.filter(f => 
        f.reported_out_date && !f.replaced_date
      ).length || 0;
      
      return {
        total,
        functional,
        needsMaintenance,
        nonFunctional,
        needsElectrician,
        emergency,
        currentOutages,
        energyEfficiency: total > 0 ? Math.round((ledCount / total) * 100) : 0,
        systemHealth: total > 0 ? Math.round((functional / total) * 100) : 0
      };
    }
  });

  const { data: alerts } = useQuery({
    queryKey: ['lighting-alerts'],
    queryFn: async () => {
      // Generate smart alerts based on data patterns
      const alerts: LightingAlert[] = [];
      
      if (stats?.currentOutages && stats.currentOutages > 5) {
        alerts.push({
          id: 'bulk-outages',
          type: 'bulk_failures',
          title: 'Multiple Fixtures Out',
          message: `${stats.currentOutages} fixtures are currently non-functional`,
          count: stats.currentOutages,
          priority: 'high',
          created_at: new Date().toISOString()
        });
      }
      
      if (stats?.needsElectrician && stats.needsElectrician > 0) {
        alerts.push({
          id: 'electrician-needed',
          type: 'maintenance_overdue',
          title: 'Electrician Required',
          message: `${stats.needsElectrician} fixtures need professional electrical work`,
          count: stats.needsElectrician,
          priority: 'medium',
          created_at: new Date().toISOString()
        });
      }
      
      return alerts;
    },
    enabled: !!stats
  });

  const { data: recentActivity } = useQuery({
    queryKey: ['recent-lighting-activity'],
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

  const handleQuickAction = (action: string) => {
    console.log('Quick action:', action);
    // Implementation will be handled by parent component
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-muted animate-pulse rounded-md"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-md"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      {alerts && alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map(alert => (
            <Card key={alert.id} className="border-destructive bg-destructive/5">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    <div>
                      <div className="font-semibold text-destructive">{alert.title}</div>
                      <div className="text-sm text-muted-foreground">{alert.message}</div>
                    </div>
                  </div>
                  <Button size="sm" variant="destructive">
                    Take Action
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">{stats?.systemHealth}%</div>
              <Progress value={stats?.systemHealth} className="h-2" />
              <div className="text-xs text-muted-foreground">
                {stats?.functional} of {stats?.total} functional
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2 text-orange-600" />
              Current Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.currentOutages}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {stats?.needsElectrician} need electrician
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Zap className="h-4 w-4 mr-2 text-blue-600" />
              Energy Efficiency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.energyEfficiency}%</div>
            <div className="text-xs text-muted-foreground mt-1">
              LED adoption rate
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Battery className="h-4 w-4 mr-2 text-red-600" />
              Emergency Lighting
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.emergency}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Emergency fixtures
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <QuickActionsPanel 
        onAction={handleQuickAction}
        needsAttentionCount={stats?.currentOutages}
        scheduledMaintenanceCount={stats?.needsMaintenance}
      />

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivity?.map(item => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    item.status === 'functional' ? 'bg-green-500' : 
                    item.status === 'non_functional' ? 'bg-red-500' : 'bg-yellow-500'
                  }`} />
                  <div>
                    <div className="font-medium text-sm">{item.name}</div>
                    <div className="text-xs text-muted-foreground">Room</div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(item.updated_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}