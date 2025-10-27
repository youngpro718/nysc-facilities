import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Warehouse, AlertCircle, TrendingUp, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { TermSheetBoard } from '@/components/court-operations/personnel/TermSheetBoard';

/**
 * Court Aide Dashboard - Supply Staff Dashboard
 * 
 * Court aides are the supply staff who handle:
 * - Supply orders (create, manage, track)
 * - Supply room (fulfill requests)
 * - Inventory management
 */
export default function CourtAideDashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  // Query pending supply requests
  const { data: pendingRequestsData } = useQuery({
    queryKey: ['supply-staff-pending-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('supply_requests')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'approved']);
      if (error) throw error;
      return count || 0;
    },
  });

  // Query low stock items
  const { data: lowStockData } = useQuery({
    queryKey: ['inventory-low-stock-count'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('id, quantity, reorder_level');
      if (error) throw error;
      return data?.filter(item => item.quantity < item.reorder_level).length || 0;
    },
  });

  // Query active orders (ready for pickup)
  const { data: activeOrdersData } = useQuery({
    queryKey: ['supply-staff-ready-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('supply_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ready');
      if (error) throw error;
      return count || 0;
    },
  });

  // Query fulfilled items this month
  const { data: itemsFulfilledData } = useQuery({
    queryKey: ['supply-staff-fulfilled-month'],
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
  });

  const stats = {
    pendingRequests: pendingRequestsData || 0,
    lowStockItems: lowStockData || 0,
    activeOrders: activeOrdersData || 0,
    itemsFulfilled: itemsFulfilledData || 0,
  };

  const quickActions = [
    {
      title: 'Supply Room',
      description: 'Fulfill and manage supply requests',
      icon: Package,
      path: '/supply-room',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Inventory',
      description: 'Manage stock levels and items',
      icon: Warehouse,
      path: '/inventory',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Supply Staff Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {profile?.first_name || 'Court Aide'}
          </p>
        </div>
        <Button onClick={() => navigate('/supply-room')}>
          <Package className="mr-2 h-4 w-4" />
          Supply Room
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingRequests}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting fulfillment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.lowStockItems}</div>
            <p className="text-xs text-muted-foreground">
              Need reordering
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Requests</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeOrders}</div>
            <p className="text-xs text-muted-foreground">
              In progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items Fulfilled</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.itemsFulfilled}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => (
            <Card
              key={action.path}
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
          <CardDescription>Your recent supply management activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 rounded-full bg-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Fulfilled request for Office Supplies</p>
                <p className="text-xs text-muted-foreground">1 hour ago</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 rounded-full bg-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Created purchase order #PO-2024-156</p>
                <p className="text-xs text-muted-foreground">3 hours ago</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 rounded-full bg-purple-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Updated inventory for Paper Products</p>
                <p className="text-xs text-muted-foreground">5 hours ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Supply Management Overview */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pending Requests</CardTitle>
            <CardDescription>Requests awaiting fulfillment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Urgent</span>
                <span className="text-sm font-medium text-red-600">3</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">High Priority</span>
                <span className="text-sm font-medium text-orange-600">5</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Normal</span>
                <span className="text-sm font-medium">4</span>
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

        <Card>
          <CardHeader>
            <CardTitle>Inventory Alerts</CardTitle>
            <CardDescription>Items needing attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Out of Stock</span>
                <span className="text-sm font-medium text-red-600">2</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Low Stock</span>
                <span className="text-sm font-medium text-orange-600">6</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Reorder Soon</span>
                <span className="text-sm font-medium text-yellow-600">10</span>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => navigate('/inventory')}
            >
              <Warehouse className="mr-2 h-4 w-4" />
              Manage Inventory
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
          <CardDescription>This month's supply management overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Fulfillment Rate</p>
              <p className="text-2xl font-bold">94%</p>
              <p className="text-xs text-green-600">+2% from last month</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Avg. Response Time</p>
              <p className="text-2xl font-bold">1.5 hrs</p>
              <p className="text-xs text-green-600">-0.3 hrs from last month</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Orders Placed</p>
              <p className="text-2xl font-bold">18</p>
              <p className="text-xs text-muted-foreground">Total this month</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Term Sheet - Court Assignments Reference */}
      <div className="mt-6">
        <TermSheetBoard />
      </div>
    </div>
  );
}
