/**
 * CommandCenter Component
 * 
 * Enhanced admin dashboard with real-time system monitoring,
 * metrics, alerts, and quick actions
 */

import { useNavigate } from 'react-router-dom';
import { useCommandCenter } from '@features/dashboard/hooks/useCommandCenter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { StatusCard } from '@/components/ui/StatusCard';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertTriangle,
  Activity,
  Package,
  ClipboardList,
  Users,
  Building2,
  Gavel,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Shield,
  Zap,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

export function CommandCenter() {
  const navigate = useNavigate();
  const { metrics, alerts, activity, isLoading, refetch } = useCommandCenter();

  if (isLoading) {
    return <CommandCenterSkeleton />;
  }

  if (!metrics) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load command center metrics. Please refresh the page.
        </AlertDescription>
      </Alert>
    );
  }

  const criticalAlerts = alerts.filter(a => a.severity === 'critical');
  const warningAlerts = alerts.filter(a => a.severity === 'warning');

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Command Center</h2>
          <p className="text-sm text-muted-foreground">Real-time system monitoring and control</p>
        </div>
        <Button variant="outline" size="sm" onClick={refetch}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Critical Alerts Banner */}
      {criticalAlerts.length > 0 && (
        <Alert variant="destructive" className="border-2">
          <AlertTriangle className="h-5 w-5" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <strong>{criticalAlerts.length} Critical Alert{criticalAlerts.length !== 1 ? 's' : ''}</strong>
              <p className="text-sm mt-1">{criticalAlerts[0].message}</p>
            </div>
            <Button variant="destructive" size="sm" onClick={() => navigate('/admin/alerts')}>
              View All
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Warning Alerts */}
      {warningAlerts.length > 0 && criticalAlerts.length === 0 && (
        <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <AlertCircle className="h-5 w-5 text-orange-600" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <strong className="text-orange-900 dark:text-orange-100">
                {warningAlerts.length} Warning{warningAlerts.length !== 1 ? 's' : ''}
              </strong>
              <p className="text-sm mt-1 text-orange-800 dark:text-orange-200">{warningAlerts[0].message}</p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatusCard
          title="Active Issues"
          value={metrics.issues.open + metrics.issues.in_progress}
          subLabel={`${metrics.issues.critical} critical`}
          icon={AlertTriangle}
          statusVariant={
            metrics.issues.critical > 0 ? 'critical' :
            metrics.issues.open > 10 ? 'warning' : 'operational'
          }
          onClick={() => navigate('/operations?tab=issues')}
        />
        <StatusCard
          title="Room Health"
          value={`${metrics.rooms.health_percentage}%`}
          subLabel={`${metrics.rooms.active}/${metrics.rooms.total} active`}
          icon={Building2}
          statusVariant={
            metrics.rooms.health_percentage >= 80 ? 'operational' :
            metrics.rooms.health_percentage >= 60 ? 'warning' : 'critical'
          }
          onClick={() => navigate('/spaces')}
        />
        <StatusCard
          title="Supply Requests"
          value={metrics.supply.total_requests}
          subLabel={`${metrics.supply.pending_approval} pending approval`}
          icon={Package}
          statusVariant={
            metrics.supply.pending_approval > 10 ? 'warning' : 'info'
          }
          onClick={() => navigate('/admin/supply-requests')}
        />
        <StatusCard
          title="Pending Tasks"
          value={metrics.tasks.pending + metrics.tasks.in_progress}
          subLabel={`${metrics.tasks.overdue} overdue`}
          icon={ClipboardList}
          statusVariant={
            metrics.tasks.overdue > 0 ? 'warning' : 'operational'
          }
          onClick={() => navigate('/tasks')}
        />
      </div>

      {/* Secondary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Users Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              User Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Users</span>
              <span className="font-semibold">{metrics.users.total_users}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Active</span>
              <Badge variant="outline">{metrics.users.active_users}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Pending Approval</span>
              <Badge variant={metrics.users.pending_approval > 5 ? 'destructive' : 'secondary'}>
                {metrics.users.pending_approval}
              </Badge>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-2"
              onClick={() => navigate('/admin/users')}
            >
              Manage Users
              <ArrowRight className="h-3 w-3 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* Court Operations Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Gavel className="h-4 w-4" />
              Court Operations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Courtrooms</span>
              <span className="font-semibold">{metrics.court.total_rooms}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Operational</span>
              <Badge variant="outline">{metrics.court.operational}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Sessions Today</span>
              <Badge variant="default">{metrics.court.sessions_today}</Badge>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-2"
              onClick={() => navigate('/court-operations')}
            >
              View Operations
              <ArrowRight className="h-3 w-3 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* Performance Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Issues Today</span>
              <Badge variant="outline">{metrics.issues.today}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">This Week</span>
              <Badge variant="outline">{metrics.issues.this_week}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Avg Resolution</span>
              <Badge variant="secondary">
                {metrics.issues.avg_resolution_time_hours 
                  ? `${metrics.issues.avg_resolution_time_hours}h`
                  : 'N/A'}
              </Badge>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-2"
              onClick={() => navigate('/admin/analytics')}
            >
              View Analytics
              <ArrowRight className="h-3 w-3 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin/activity')}>
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          <CardDescription>Latest system events and user actions</CardDescription>
        </CardHeader>
        <CardContent>
          {activity.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {activity.slice(0, 8).map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  <div className={`p-2 rounded-full ${
                    item.type === 'issue' ? 'bg-orange-100 dark:bg-orange-950' :
                    item.type === 'supply_request' ? 'bg-green-100 dark:bg-green-950' :
                    'bg-blue-100 dark:bg-blue-950'
                  }`}>
                    {item.type === 'issue' ? <AlertTriangle className="h-4 w-4 text-orange-600" /> :
                     item.type === 'supply_request' ? <Package className="h-4 w-4 text-green-600" /> :
                     <Activity className="h-4 w-4 text-blue-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground capitalize">
                        {item.type.replace('_', ' ')}
                      </span>
                      {item.status && (
                        <Badge variant="outline" className="text-xs">
                          {item.status}
                        </Badge>
                      )}
                      {item.priority && (
                        <Badge 
                          variant={
                            item.priority === 'high' || item.priority === 'urgent' ? 'destructive' :
                            item.priority === 'medium' ? 'default' : 'secondary'
                          }
                          className="text-xs"
                        >
                          {item.priority}
                        </Badge>
                      )}
                    </div>
                    <p className="font-medium text-sm truncate">{item.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      {item.user_name && <span>{item.user_name}</span>}
                      <span>•</span>
                      <span>{formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border-2 border-dashed border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              variant="outline"
              className="h-20 flex flex-col gap-2"
              onClick={() => navigate('/admin/users')}
            >
              <Users className="h-6 w-6" />
              <span className="text-sm">Manage Users</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col gap-2"
              onClick={() => navigate('/admin/supply-requests')}
            >
              <Package className="h-6 w-6" />
              <span className="text-sm">Supply Requests</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col gap-2"
              onClick={() => navigate('/operations?tab=issues')}
            >
              <AlertTriangle className="h-6 w-6" />
              <span className="text-sm">View Issues</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col gap-2"
              onClick={() => navigate('/admin/settings')}
            >
              <Shield className="h-6 w-6" />
              <span className="text-sm">System Settings</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CommandCenterSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[110px]" />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[200px]" />
        ))}
      </div>

      <Skeleton className="h-[400px]" />
    </div>
  );
}
