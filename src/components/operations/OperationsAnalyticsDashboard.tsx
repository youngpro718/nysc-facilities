import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Package,
  Wrench,
  KeyRound,
  Calendar,
  Activity
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

interface OperationsMetrics {
  issues: {
    total: number;
    open: number;
    resolved: number;
    critical: number;
    avgResolutionTime: number;
  };
  maintenance: {
    total: number;
    scheduled: number;
    completed: number;
    overdue: number;
    upcomingWeek: number;
  };
  supplies: {
    totalRequests: number;
    pending: number;
    approved: number;
    fulfilled: number;
    avgProcessingTime: number;
  };
  keys: {
    totalKeys: number;
    assigned: number;
    available: number;
    lost: number;
    assignmentRate: number;
  };
  inventory: {
    totalItems: number;
    lowStock: number;
    outOfStock: number;
    totalValue: number;
    recentTransactions: number;
  };
}

export function OperationsAnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('30'); // days

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['operations-analytics', timeRange],
    queryFn: async (): Promise<OperationsMetrics> => {
      const endDate = new Date();
      const startDate = subDays(endDate, parseInt(timeRange));

      // Fetch all data in parallel
      const [
        issuesData,
        maintenanceData,
        suppliesData,
        keysData,
        inventoryData
      ] = await Promise.all([
        // Issues analytics
        supabase
          .from('issues')
          .select('id, status, priority, created_at, resolved_at')
          .gte('created_at', startDate.toISOString()),

        // Maintenance analytics
        supabase
          .from('maintenance_requests')
          .select('id, status, scheduled_date, completed_at, created_at')
          .gte('created_at', startDate.toISOString()),

        // Supply requests analytics
        supabase
          .from('supply_requests')
          .select('id, status, created_at, approved_at, fulfilled_at')
          .gte('created_at', startDate.toISOString()),

        // Keys analytics
        supabase
          .from('keys')
          .select('id, status, active_assignments, lost_count'),

        // Inventory analytics
        supabase
          .from('inventory_items')
          .select('id, quantity, minimum_quantity')
      ]);

      // Process issues data
      const issues = issuesData.data || [];
      const openIssues = issues.filter(i => i.status !== 'resolved');
      const resolvedIssues = issues.filter(i => i.status === 'resolved');
      const criticalIssues = issues.filter(i => i.priority === 'critical' || i.priority === 'high');
      
      const avgResolutionTime = resolvedIssues.length > 0 
        ? resolvedIssues.reduce((acc, issue) => {
            if (issue.resolved_at) {
              const resolutionTime = new Date(issue.resolved_at).getTime() - new Date(issue.created_at).getTime();
              return acc + (resolutionTime / (1000 * 60 * 60)); // hours
            }
            return acc;
          }, 0) / resolvedIssues.length
        : 0;

      // Process maintenance data
      const maintenance = maintenanceData.data || [];
      const scheduledMaintenance = maintenance.filter(m => m.status === 'scheduled');
      const completedMaintenance = maintenance.filter(m => m.status === 'completed');
      const overdueMaintenance = maintenance.filter(m => 
        m.status === 'scheduled' && new Date(m.scheduled_date) < new Date()
      );
      const upcomingWeek = maintenance.filter(m => {
        const scheduledDate = new Date(m.scheduled_date);
        const weekFromNow = new Date();
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        return m.status === 'scheduled' && scheduledDate <= weekFromNow && scheduledDate >= new Date();
      });

      // Process supplies data
      const supplies = suppliesData.data || [];
      const pendingSupplies = supplies.filter(s => s.status === 'pending');
      const approvedSupplies = supplies.filter(s => s.status === 'approved');
      const fulfilledSupplies = supplies.filter(s => s.status === 'fulfilled');
      
      const avgProcessingTime = fulfilledSupplies.length > 0
        ? fulfilledSupplies.reduce((acc, supply) => {
            if (supply.fulfilled_at) {
              const processingTime = new Date(supply.fulfilled_at).getTime() - new Date(supply.created_at).getTime();
              return acc + (processingTime / (1000 * 60 * 60)); // hours
            }
            return acc;
          }, 0) / fulfilledSupplies.length
        : 0;

      // Process keys data
      const keys = keysData.data || [];
      const assignedKeys = keys.reduce((acc, key) => acc + (key.active_assignments || 0), 0);
      const availableKeys = keys.filter(k => k.status === 'available').length;
      const lostKeys = keys.reduce((acc, key) => acc + (key.lost_count || 0), 0);
      const assignmentRate = keys.length > 0 ? (assignedKeys / keys.length) * 100 : 0;

      // Process inventory data
      const inventory = inventoryData.data || [];
      const lowStockItems = inventory.filter(i => i.quantity <= i.minimum_quantity);
      const outOfStockItems = inventory.filter(i => i.quantity === 0);
      const totalValue = inventory.reduce((acc, item) => acc + item.quantity, 0);

      return {
        issues: {
          total: issues.length,
          open: openIssues.length,
          resolved: resolvedIssues.length,
          critical: criticalIssues.length,
          avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
        },
        maintenance: {
          total: maintenance.length,
          scheduled: scheduledMaintenance.length,
          completed: completedMaintenance.length,
          overdue: overdueMaintenance.length,
          upcomingWeek: upcomingWeek.length,
        },
        supplies: {
          totalRequests: supplies.length,
          pending: pendingSupplies.length,
          approved: approvedSupplies.length,
          fulfilled: fulfilledSupplies.length,
          avgProcessingTime: Math.round(avgProcessingTime * 10) / 10,
        },
        keys: {
          totalKeys: keys.length,
          assigned: assignedKeys,
          available: availableKeys,
          lost: lostKeys,
          assignmentRate: Math.round(assignmentRate * 10) / 10,
        },
        inventory: {
          totalItems: inventory.length,
          lowStock: lowStockItems.length,
          outOfStock: outOfStockItems.length,
          totalValue,
          recentTransactions: 0, // Would need transaction data
        },
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Operations Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive facility operations insights and trends
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.issues.open || 0}</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.issues.critical || 0} critical
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Maintenance</CardTitle>
            <Wrench className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.maintenance.scheduled || 0}</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.maintenance.overdue || 0} overdue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Supply Requests</CardTitle>
            <Package className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.supplies.pending || 0}</div>
            <p className="text-xs text-muted-foreground">
              pending approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Key Utilization</CardTitle>
            <KeyRound className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.keys.assignmentRate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              assignment rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="supplies">Supplies</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Issue Resolution Rate</span>
                  <span className="font-semibold">
                    {metrics?.issues.total ? Math.round((metrics.issues.resolved / metrics.issues.total) * 100) : 0}%
                  </span>
                </div>
                <Progress 
                  value={metrics?.issues.total ? (metrics.issues.resolved / metrics.issues.total) * 100 : 0} 
                  className="h-2" 
                />

                <div className="flex justify-between items-center">
                  <span>Maintenance Completion</span>
                  <span className="font-semibold">
                    {metrics?.maintenance.total ? Math.round((metrics.maintenance.completed / metrics.maintenance.total) * 100) : 0}%
                  </span>
                </div>
                <Progress 
                  value={metrics?.maintenance.total ? (metrics.maintenance.completed / metrics.maintenance.total) * 100 : 0} 
                  className="h-2" 
                />

                <div className="flex justify-between items-center">
                  <span>Supply Fulfillment</span>
                  <span className="font-semibold">
                    {metrics?.supplies.totalRequests ? Math.round((metrics.supplies.fulfilled / metrics.supplies.totalRequests) * 100) : 0}%
                  </span>
                </div>
                <Progress 
                  value={metrics?.supplies.totalRequests ? (metrics.supplies.fulfilled / metrics.supplies.totalRequests) * 100 : 0} 
                  className="h-2" 
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Response Times</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Avg Issue Resolution</span>
                  <Badge variant="outline">
                    {metrics?.issues.avgResolutionTime || 0}h
                  </Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span>Avg Supply Processing</span>
                  <Badge variant="outline">
                    {metrics?.supplies.avgProcessingTime || 0}h
                  </Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span>Upcoming Maintenance</span>
                  <Badge variant="outline">
                    {metrics?.maintenance.upcomingWeek || 0} this week
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="issues" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Issue Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Open Issues</span>
                  <Badge variant="destructive">{metrics?.issues.open || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Resolved Issues</span>
                  <Badge variant="default">{metrics?.issues.resolved || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Critical Issues</span>
                  <Badge variant="destructive">{metrics?.issues.critical || 0}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resolution Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {metrics?.issues.avgResolutionTime || 0}h
                  </div>
                  <p className="text-sm text-muted-foreground">Average Resolution Time</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {metrics?.issues.total ? Math.round((metrics.issues.resolved / metrics.issues.total) * 100) : 0}%
                  </div>
                  <p className="text-sm text-muted-foreground">Resolution Rate</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Maintenance Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Total Requests</span>
                  <span className="font-semibold">{metrics?.maintenance.total || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Scheduled</span>
                  <Badge variant="outline">{metrics?.maintenance.scheduled || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Completed</span>
                  <Badge variant="default">{metrics?.maintenance.completed || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Overdue</span>
                  <Badge variant="destructive">{metrics?.maintenance.overdue || 0}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Upcoming Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">
                    {metrics?.maintenance.upcomingWeek || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Tasks This Week</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="supplies" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Supply Request Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Total Requests</span>
                  <span className="font-semibold">{metrics?.supplies.totalRequests || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Pending</span>
                  <Badge variant="outline">{metrics?.supplies.pending || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Approved</span>
                  <Badge variant="default">{metrics?.supplies.approved || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Fulfilled</span>
                  <Badge variant="default">{metrics?.supplies.fulfilled || 0}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Processing Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {metrics?.supplies.avgProcessingTime || 0}h
                  </div>
                  <p className="text-sm text-muted-foreground">Average Processing Time</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Inventory Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Total Items</span>
                  <span className="font-semibold">{metrics?.inventory.totalItems || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Low Stock</span>
                  <Badge variant="destructive">{metrics?.inventory.lowStock || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Out of Stock</span>
                  <Badge variant="destructive">{metrics?.inventory.outOfStock || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Total Quantity</span>
                  <span className="font-semibold">{metrics?.inventory.totalValue || 0}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Stock Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Well Stocked</span>
                    <span className="font-semibold text-green-600">
                      {metrics?.inventory.totalItems ? 
                        Math.round(((metrics.inventory.totalItems - metrics.inventory.lowStock) / metrics.inventory.totalItems) * 100) : 0}%
                    </span>
                  </div>
                  <Progress 
                    value={metrics?.inventory.totalItems ? 
                      ((metrics.inventory.totalItems - metrics.inventory.lowStock) / metrics.inventory.totalItems) * 100 : 0} 
                    className="h-2" 
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
