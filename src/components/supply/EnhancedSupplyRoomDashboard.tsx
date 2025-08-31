import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { supabase } from '@/lib/supabase';
import { 
  Package, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Warehouse,
  ClipboardList,
  Settings,
  RefreshCw
} from 'lucide-react';
import { InventoryManagement } from './InventoryManagement';
import { SupplyRequestTracking } from './SupplyRequestTracking';

export function EnhancedSupplyRoomDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { userRole, permissions } = useRolePermissions();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardStats, setDashboardStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    lowStockItems: 0,
    completedToday: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true);
      
      // Fetch supply requests stats
      const { data: requestsData, error: requestsError } = await supabase
        .from('supply_requests')
        .select('id, status, created_at')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

      if (requestsError) throw requestsError;

      // Fetch inventory stats (mock data for now)
      const totalRequests = requestsData?.length || 0;
      const pendingRequests = requestsData?.filter(r => 
        ['submitted', 'received', 'processing'].includes(r.status)
      ).length || 0;
      
      const today = new Date().toDateString();
      const completedToday = requestsData?.filter(r => 
        r.status === 'completed' && new Date(r.created_at).toDateString() === today
      ).length || 0;

      setDashboardStats({
        totalRequests,
        pendingRequests,
        lowStockItems: 5, // Mock data - would come from inventory
        completedToday
      });

    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard statistics",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Determine user role for component props
  const getSupplyRole = () => {
    if (userRole === 'admin' || permissions?.supply_requests === 'admin') {
      return 'supply_manager';
    }
    if (userRole === 'supply_room_staff' || permissions?.supply_requests === 'write') {
      return 'supply_staff';
    }
    return 'requester';
  };

  const supplyRole = getSupplyRole();
  const isSupplyStaff = supplyRole === 'supply_staff' || supplyRole === 'supply_manager';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading supply room dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Supply Room Management</h1>
          <p className="text-muted-foreground">
            {supplyRole === 'supply_manager' 
              ? 'Complete supply room management'
              : supplyRole === 'supply_staff'
              ? 'Supply request fulfillment and inventory management'
              : 'Track your supply requests and view available inventory'
            }
          </p>
        </div>
        <Button onClick={fetchDashboardStats} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.totalRequests}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{dashboardStats.pendingRequests}</div>
            <p className="text-xs text-muted-foreground">Awaiting action</p>
          </CardContent>
        </Card>

        {isSupplyStaff && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{dashboardStats.lowStockItems}</div>
              <p className="text-xs text-muted-foreground">Need restocking</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{dashboardStats.completedToday}</div>
            <p className="text-xs text-muted-foreground">Requests fulfilled</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3">
          <TabsTrigger value="dashboard">
            <ClipboardList className="h-4 w-4 mr-2" />
            Requests
          </TabsTrigger>
          {isSupplyStaff && (
            <TabsTrigger value="inventory">
              <Warehouse className="h-4 w-4 mr-2" />
              Inventory
            </TabsTrigger>
          )}
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <SupplyRequestTracking userRole={supplyRole} />
        </TabsContent>

        {isSupplyStaff && (
          <TabsContent value="inventory" className="space-y-4">
            <InventoryManagement />
          </TabsContent>
        )}

        {/* Analytics tab removed */}

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Supply Room Settings</CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure supply room preferences and notifications
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Email Notifications</div>
                    <div className="text-sm text-muted-foreground">
                      Receive notifications for new requests and low stock alerts
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Auto-Assignment</div>
                    <div className="text-sm text-muted-foreground">
                      Automatically assign requests to available staff
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Setup
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Reorder Thresholds</div>
                    <div className="text-sm text-muted-foreground">
                      Set minimum stock levels for automatic reorder alerts
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Manage
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
