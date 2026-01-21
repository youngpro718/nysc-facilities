/**
 * RoleDashboard - Unified dashboard for CMC, Court Aide, and Purchasing roles
 * 
 * This replaces:
 * - CMCDashboard.tsx
 * - CourtAideDashboard.tsx
 * - PurchasingDashboard.tsx
 * 
 * AdminDashboard and UserDashboard remain separate.
 */

import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { TermSheetBoard } from '@/components/court-operations/personnel/TermSheetBoard';
import { supabase } from '@/lib/supabase';
import { getRoleDashboardConfig, DashboardRole } from '@/config/roleDashboardConfig';
import { Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function RoleDashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { userRole, loading: roleLoading } = useRolePermissions();

  // Get role config
  const config = getRoleDashboardConfig(userRole || '');

  // Fetch real data for all stats
  const { data: supplyRequests = [] } = useQuery({
    queryKey: ['role-dashboard-supply-requests', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('supply_requests')
        .select('id, status')
        .eq('requester_id', user.id)
        .not('status', 'in', '(completed,cancelled)');
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: myIssues = [] } = useQuery({
    queryKey: ['role-dashboard-issues', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('issues')
        .select('id, status')
        .eq('reported_by', user.id)
        .not('status', 'in', '(resolved,closed)');
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: pendingRequestsCount = 0 } = useQuery({
    queryKey: ['role-dashboard-pending-requests'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('supply_requests')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'approved']);
      if (error) throw error;
      return count || 0;
    },
    enabled: userRole === 'court_aide' || userRole === 'purchasing_staff',
  });

  const { data: lowStockCount = 0 } = useQuery({
    queryKey: ['role-dashboard-low-stock'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('id, quantity, reorder_level');
      if (error) throw error;
      return data?.filter(item => item.quantity < item.reorder_level).length || 0;
    },
    enabled: userRole === 'court_aide' || userRole === 'purchasing_staff',
  });

  const { data: activeOrdersCount = 0 } = useQuery({
    queryKey: ['role-dashboard-active-orders'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('supply_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ready');
      if (error) throw error;
      return count || 0;
    },
    enabled: userRole === 'court_aide',
  });

  const { data: itemsFulfilledCount = 0 } = useQuery({
    queryKey: ['role-dashboard-fulfilled'],
    queryFn: async () => {
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const { count, error } = await supabase
        .from('supply_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('fulfilled_at', startOfMonth.toISOString());
      if (error) throw error;
      return count || 0;
    },
    enabled: userRole === 'court_aide',
  });

  // Court Aide specific: Available tasks (approved but unclaimed)
  const { data: availableTasksCount = 0 } = useQuery({
    queryKey: ['role-dashboard-available-tasks'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('staff_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved')
        .is('claimed_by', null);
      if (error) throw error;
      return count || 0;
    },
    enabled: userRole === 'court_aide',
  });

  // Court Aide specific: My active tasks (claimed by or assigned to me)
  const { data: myActiveTasksCount = 0 } = useQuery({
    queryKey: ['role-dashboard-my-active-tasks', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { count, error } = await supabase
        .from('staff_tasks')
        .select('*', { count: 'exact', head: true })
        .or(`claimed_by.eq.${user.id},assigned_to.eq.${user.id}`)
        .in('status', ['claimed', 'in_progress']);
      if (error) throw error;
      return count || 0;
    },
    enabled: userRole === 'court_aide' && !!user?.id,
  });

  const { data: courtroomStats } = useQuery({
    queryKey: ['role-dashboard-courtrooms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('court_rooms')
        .select('id, is_active');
      if (error) throw error;
      const total = data?.length || 0;
      const active = data?.filter(r => r.is_active).length || 0;
      return { total, active };
    },
    enabled: userRole === 'cmc',
  });

  const { data: upcomingTermsCount = 0 } = useQuery({
    queryKey: ['role-dashboard-upcoming-terms'],
    queryFn: async () => {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      const { count, error } = await supabase
        .from('court_terms')
        .select('*', { count: 'exact', head: true })
        .gte('start_date', new Date().toISOString())
        .lte('start_date', thirtyDaysFromNow.toISOString());
      if (error) throw error;
      return count || 0;
    },
    enabled: userRole === 'cmc',
  });

  // Recent activity from real data
  const { data: recentActivity = [] } = useQuery({
    queryKey: ['role-dashboard-activity', user?.id, userRole],
    queryFn: async () => {
      // Fetch recent issues and supply requests
      const [issuesResult, supplyResult] = await Promise.all([
        supabase
          .from('issues')
          .select('id, title, status, created_at')
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('supply_requests')
          .select('id, status, created_at')
          .order('created_at', { ascending: false })
          .limit(3),
      ]);

      const activities: { id: string; type: string; message: string; time: string; color: string }[] = [];

      if (issuesResult.data) {
        issuesResult.data.forEach(issue => {
          activities.push({
            id: issue.id,
            type: 'issue',
            message: `Issue: ${issue.title}`,
            time: formatDistanceToNow(new Date(issue.created_at), { addSuffix: true }),
            color: issue.status === 'resolved' ? 'bg-green-600' : 'bg-orange-600',
          });
        });
      }

      if (supplyResult.data) {
        supplyResult.data.forEach(req => {
          activities.push({
            id: req.id,
            type: 'supply',
            message: `Supply request ${req.status}`,
            time: formatDistanceToNow(new Date(req.created_at), { addSuffix: true }),
            color: req.status === 'completed' ? 'bg-green-600' : 'bg-blue-600',
          });
        });
      }

      return activities.sort((a, b) => 0).slice(0, 5);
    },
  });

  // Build stats values
  const statsValues: Record<string, { value: number | string; badge?: string }> = {
    activeCourtrooms: {
      value: `${courtroomStats?.active || 0}/${courtroomStats?.total || 0}`,
    },
    myIssues: {
      value: myIssues.length,
      badge: myIssues.length > 0 ? 'Active' : undefined,
    },
    mySupplyRequests: {
      value: supplyRequests.length,
      badge: supplyRequests.length > 0 ? 'In Progress' : undefined,
    },
    upcomingTerms: { value: upcomingTermsCount },
    pendingRequests: { value: pendingRequestsCount },
    lowStockItems: { value: lowStockCount },
    activeOrders: { value: activeOrdersCount },
    itemsFulfilled: { value: itemsFulfilledCount },
    reorderRecommendations: { value: lowStockCount },
    // Court Aide specific stats
    availableTasks: { 
      value: availableTasksCount, 
      badge: availableTasksCount > 0 ? 'Available' : undefined 
    },
    myActiveTasks: { 
      value: myActiveTasksCount, 
      badge: myActiveTasksCount > 0 ? 'In Progress' : undefined 
    },
  };

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!config) {
    // Fallback - redirect to user dashboard
    navigate('/dashboard');
    return null;
  }

  const firstName = profile?.first_name || config.greeting;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{config.title}</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {firstName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {config.secondaryAction && (
            <Button variant="outline" onClick={() => navigate(config.secondaryAction!.path)}>
              <config.secondaryAction.icon className="mr-2 h-4 w-4" />
              {config.secondaryAction.label}
            </Button>
          )}
          <Button onClick={() => navigate(config.primaryAction.path)}>
            <config.primaryAction.icon className="mr-2 h-4 w-4" />
            {config.primaryAction.label}
          </Button>
        </div>
      </div>

      {/* Info Banner (for purchasing) */}
      {config.infoBanner && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <config.infoBanner.icon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">{config.infoBanner.title}</h3>
                <p className="text-sm text-blue-700 mt-1">{config.infoBanner.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {config.statsConfig.map((stat) => {
          const statData = statsValues[stat.id];
          return (
            <Card
              key={stat.id}
              className={stat.clickable ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}
              onClick={stat.clickable && stat.clickPath ? () => navigate(stat.clickPath!) : undefined}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{statData?.value ?? 0}</span>
                  {statData?.badge && (
                    <Badge variant="secondary">{statData.badge}</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {config.quickActions.map((action) => (
            <Card
              key={action.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(action.path)}
            >
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg ${action.bgColor} flex items-center justify-center mb-2`}>
                  <action.icon className={`h-6 w-6 ${action.color}`} />
                </div>
                <CardTitle>{action.title}</CardTitle>
                <CardDescription>{action.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest updates and changes</CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${activity.color}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role-specific sections */}
      <div className="grid gap-4 md:grid-cols-2">
        {config.showInventoryAlerts && (
          <Card>
            <CardHeader>
              <CardTitle>Inventory Alerts</CardTitle>
              <CardDescription>Items needing attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Low Stock</span>
                  <span className="text-sm font-medium text-orange-600">{lowStockCount}</span>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => navigate('/inventory')}
              >
                Manage Inventory
              </Button>
            </CardContent>
          </Card>
        )}

        {config.showPendingRequests && (
          <Card>
            <CardHeader>
              <CardTitle>Pending Requests</CardTitle>
              <CardDescription>Requests awaiting fulfillment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Pending/Approved</span>
                  <span className="text-sm font-medium">{pendingRequestsCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Ready for Pickup</span>
                  <span className="text-sm font-medium">{activeOrdersCount}</span>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => navigate('/supply-room')}
              >
                View All Requests
              </Button>
            </CardContent>
          </Card>
        )}

        {config.showPerformanceMetrics && userRole === 'cmc' && (
          <Card>
            <CardHeader>
              <CardTitle>Courtroom Status</CardTitle>
              <CardDescription>Current operational status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Operational</span>
                  <span className="text-sm font-medium">{courtroomStats?.active || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Under Maintenance</span>
                  <span className="text-sm font-medium">{(courtroomStats?.total || 0) - (courtroomStats?.active || 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Total</span>
                  <span className="text-sm font-medium">{courtroomStats?.total || 0}</span>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => navigate('/court-operations')}
              >
                View All Courtrooms
              </Button>
            </CardContent>
          </Card>
        )}

        {config.showPerformanceMetrics && userRole === 'court_aide' && (
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>This month's overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Fulfilled This Month</p>
                  <p className="text-2xl font-bold">{itemsFulfilledCount}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{pendingRequestsCount}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Ready</p>
                  <p className="text-2xl font-bold">{activeOrdersCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Term Sheet */}
      {config.showTermSheet && (
        <div className="mt-6">
          <TermSheetBoard />
        </div>
      )}
    </div>
  );
}
