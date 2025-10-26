import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Warehouse, Package, AlertCircle, TrendingUp, DollarSign, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { TermSheetBoard } from '@/components/court-operations/personnel/TermSheetBoard';

/**
 * Purchasing Dashboard - Purchasing Staff Dashboard
 * 
 * Purchasing staff can:
 * - View inventory levels (read-only)
 * - View supply room requests (read-only)
 * - Assist with fulfillment planning
 * - Monitor stock levels for reordering
 * 
 * Note: Court Aides handle actual purchase orders
 */
export default function PurchasingDashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [stats] = useState({
    lowStockItems: 8,
    pendingRequests: 12,
    reorderRecommendations: 15,
    monthlyBudget: 5000,
  });

  const quickActions = [
    {
      title: 'Inventory Overview',
      description: 'View stock levels and reorder recommendations',
      icon: Warehouse,
      path: '/inventory',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Supply Room',
      description: 'View supply requests and assist with planning',
      icon: Package,
      path: '/supply-room',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Supply Requests',
      description: 'View all supply requests',
      icon: FileText,
      path: '/supply-requests',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Purchasing Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {profile?.first_name || 'Purchasing Staff'}
          </p>
        </div>
        <Button onClick={() => navigate('/inventory')}>
          <Warehouse className="mr-2 h-4 w-4" />
          View Inventory
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.lowStockItems}</div>
            <p className="text-xs text-muted-foreground">
              Need attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
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
            <CardTitle className="text-sm font-medium">Reorder Recommendations</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.reorderRecommendations}</div>
            <p className="text-xs text-muted-foreground">
              Items to consider
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.monthlyBudget.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Available
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

      {/* Info Banner */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">Purchasing Support Role</h3>
              <p className="text-sm text-blue-700 mt-1">
                You have view-only access to inventory and supply room data to assist with planning and recommendations. 
                Court Aides handle actual purchase orders and fulfillment.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Recent inventory and supply updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 rounded-full bg-orange-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Low stock alert: Copy Paper</p>
                <p className="text-xs text-muted-foreground">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 rounded-full bg-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">New supply request from Courtroom 301</p>
                <p className="text-xs text-muted-foreground">4 hours ago</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 rounded-full bg-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Inventory updated: Office Supplies</p>
                <p className="text-xs text-muted-foreground">1 day ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Overview */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Stock Alerts</CardTitle>
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
              View Inventory
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Supply Requests</CardTitle>
            <CardDescription>Current request status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Pending</span>
                <span className="text-sm font-medium">8</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">In Progress</span>
                <span className="text-sm font-medium">4</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Fulfilled Today</span>
                <span className="text-sm font-medium text-green-600">12</span>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => navigate('/supply-room')}
            >
              View Supply Room
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Reorder Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Reorder Recommendations</CardTitle>
          <CardDescription>Items to consider for reordering</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Copy Paper (White, Letter)</p>
                <p className="text-sm text-muted-foreground">Current: 5 reams | Recommended: 50 reams</p>
              </div>
              <span className="text-sm font-medium text-red-600">Critical</span>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Pens (Blue, Ballpoint)</p>
                <p className="text-sm text-muted-foreground">Current: 15 boxes | Recommended: 30 boxes</p>
              </div>
              <span className="text-sm font-medium text-orange-600">High</span>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">File Folders (Manila)</p>
                <p className="text-sm text-muted-foreground">Current: 20 boxes | Recommended: 40 boxes</p>
              </div>
              <span className="text-sm font-medium text-yellow-600">Medium</span>
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
