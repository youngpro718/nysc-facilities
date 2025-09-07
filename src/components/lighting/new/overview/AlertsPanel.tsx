import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  Clock, 
  ZapOff, 
  Wrench,
  CheckCircle,
  X,
  Eye,
  Calendar
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchLightingFixtures } from "@/lib/supabase";

interface AlertItem {
  id: string;
  type: 'critical' | 'warning' | 'maintenance' | 'info';
  title: string;
  description: string;
  fixtureId?: string;
  fixtureName?: string;
  location?: string;
  timestamp: Date;
  resolved?: boolean;
}

export function AlertsPanel() {
  const [resolvedAlerts, setResolvedAlerts] = useState<string[]>([]);
  const { data: fixtures } = useQuery({
    queryKey: ['lighting-fixtures'],
    queryFn: fetchLightingFixtures,
  });

  // Generate alerts from fixture data
  const generateAlerts = (): AlertItem[] => {
    if (!fixtures) return [];
    
    const alerts: AlertItem[] = [];

    (fixtures || []).forEach(fixture => {
      // Critical alerts for non-functional fixtures
      if (fixture.status === 'non_functional') {
        alerts.push({
          id: `critical-${fixture.id}`,
          type: 'critical',
          title: 'Fixture Out of Order',
          description: `${fixture.name} is currently non-functional and requires immediate attention.`,
          fixtureId: fixture.id,
          fixtureName: fixture.name,
          location: `${fixture.building_name || 'Unknown Building'} - ${fixture.floor_name || 'Unknown Floor'} - ${fixture.space_name || fixture.room_number || 'Unknown Room'}`,
          timestamp: new Date()
        });
      }

      // Maintenance alerts
      if (fixture.status === 'maintenance_needed') {
        alerts.push({
          id: `maintenance-${fixture.id}`,
          type: 'warning',
          title: 'Maintenance Required',
          description: `${fixture.name} requires scheduled maintenance.`,
          fixtureId: fixture.id,
          fixtureName: fixture.name,
          location: `${fixture.building_name || 'Unknown Building'} - ${fixture.floor_name || 'Unknown Floor'} - ${fixture.space_name || fixture.room_number || 'Unknown Room'}`,
          timestamp: new Date()
        });
      }

      // Overdue maintenance alerts
      if (fixture.next_maintenance_date) {
        const nextMaintenance = new Date(fixture.next_maintenance_date);
        const now = new Date();
        if (nextMaintenance < now) {
          alerts.push({
            id: `overdue-${fixture.id}`,
            type: 'critical',
            title: 'Overdue Maintenance',
            description: `${fixture.name} maintenance was due on ${nextMaintenance.toLocaleDateString()}.`,
            fixtureId: fixture.id,
            fixtureName: fixture.name,
            location: `${fixture.building_name || 'Unknown Building'} - ${fixture.floor_name || 'Unknown Floor'} - ${fixture.space_name || fixture.room_number || 'Unknown Room'}`,
            timestamp: nextMaintenance
          });
        }
      }
    });

    return alerts.filter(alert => !resolvedAlerts.includes(alert.id));
  };

  const alerts = generateAlerts();
  const criticalAlerts = alerts.filter(a => a.type === 'critical');
  const warningAlerts = alerts.filter(a => a.type === 'warning');

  const getAlertIcon = (type: AlertItem['type']) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <Clock className="h-4 w-4 text-warning" />;
      case 'maintenance':
        return <Wrench className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getAlertBadge = (type: AlertItem['type']) => {
    switch (type) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      case 'maintenance':
        return <Badge variant="outline">Maintenance</Badge>;
      default:
        return <Badge variant="secondary">Info</Badge>;
    }
  };

  const handleResolveAlert = (alertId: string) => {
    setResolvedAlerts(prev => [...prev, alertId]);
  };

  const handleViewFixture = (fixtureId: string) => {
    // Scroll to fixture or navigate to fixture details
    const element = document.getElementById(`fixture-card-${fixtureId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.style.border = '2px solid hsl(var(--primary))';
      setTimeout(() => {
        element.style.border = '';
      }, 3000);
    }
  };

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            All Clear
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No active alerts. All lighting fixtures are operating normally.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Active Alerts</h2>
        <div className="flex gap-2">
          {criticalAlerts.length > 0 && (
            <Badge variant="destructive" className="text-sm">
              {criticalAlerts.length} Critical
            </Badge>
          )}
          {warningAlerts.length > 0 && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              {warningAlerts.length} Warning
            </Badge>
          )}
        </div>
      </div>

      <div className="grid gap-4">
        {alerts.map((alert) => (
          <Card key={alert.id} className={alert.type === 'critical' ? 'border-destructive' : ''}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {getAlertIcon(alert.type)}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{alert.title}</h3>
                      {getAlertBadge(alert.type)}
                    </div>
                    <p className="text-sm text-muted-foreground">{alert.description}</p>
                    {alert.location && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {alert.location}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {alert.fixtureId && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewFixture(alert.fixtureId!)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Fixture
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleResolveAlert(alert.id)}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Resolve
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleResolveAlert(alert.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}