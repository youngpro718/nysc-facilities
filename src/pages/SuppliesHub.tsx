/**
 * SUPPLIES HUB - Unified Supply Management
 * 
 * Consolidates all supply-related functionality:
 * - My Requests (for all users)
 * - Fulfillment (for supply staff)
 * - Tasks (for supply staff)
 * - Inventory Management (for staff/admin)
 */

import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { 
  Package, 
  Boxes, 
  ClipboardList,
  Truck,
  Plus,
  ChevronLeft,
  RefreshCw
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRolePermissions } from "@/hooks/useRolePermissions";
import { useSupplyRequests } from "@/hooks/useSupplyRequests";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

// Import existing components
import MySupplyRequests from "@/pages/MySupplyRequests";
import { InventoryDashboard } from "@/pages/InventoryDashboard";
import { ImprovedSupplyStaffDashboard } from "@/components/supply/ImprovedSupplyStaffDashboard";
import { StaffTasksTab } from "@/components/tasks/StaffTasksTab";

interface TabConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  tooltip: string;
  showForRoles: ('all' | 'staff' | 'admin')[];
}

export default function SuppliesHub() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { permissions, userRole } = useRolePermissions();
  
  // Determine user access level
  // Check permissions for supply-related features
  const isSupplyStaff = userRole === 'court_aide' || userRole === 'purchasing_staff';
  const isAdmin = userRole === 'admin' || userRole === 'facilities_manager';
  // Use permission system for access control
  const canManageInventory = permissions.inventory === 'admin' || permissions.inventory === 'write' || isAdmin;
  const canFulfillOrders = permissions.supply_requests === 'admin' || isSupplyStaff || isAdmin;
  
  // Get tab from URL or default based on role
  const defaultTab = canFulfillOrders ? 'fulfillment' : 'my-requests';
  const activeTab = searchParams.get('tab') || defaultTab;
  
  // Data hooks
  const { data: myRequests = [], isLoading: requestsLoading, refetch: refetchRequests } = useSupplyRequests(user?.id);
  
  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  // Calculate stats
  const activeRequestCount = myRequests.filter(r => 
    !['completed', 'cancelled', 'rejected'].includes(r.status)
  ).length;

  // Build available tabs based on user role
  const getVisibleTabs = () => {
    const tabs: TabConfig[] = [
      {
        id: 'my-requests',
        label: 'My Requests',
        icon: <ClipboardList className="h-4 w-4" />,
        tooltip: 'Your submitted supply requests',
        showForRoles: ['all']
      },
      {
        id: 'fulfillment',
        label: 'Fulfillment',
        icon: <Truck className="h-4 w-4" />,
        tooltip: 'Process and fulfill incoming orders',
        showForRoles: ['staff', 'admin']
      },
      {
        id: 'tasks',
        label: 'Tasks',
        icon: <ClipboardList className="h-4 w-4" />,
        tooltip: 'Staff tasks and assignments',
        showForRoles: ['staff', 'admin']
      },
      {
        id: 'inventory',
        label: 'Inventory',
        icon: <Boxes className="h-4 w-4" />,
        tooltip: 'Manage stock levels and items',
        showForRoles: ['staff', 'admin']
      }
    ];

    return tabs.filter(tab => {
      if (tab.showForRoles.includes('all')) return true;
      if (tab.showForRoles.includes('admin') && isAdmin) return true;
      if (tab.showForRoles.includes('staff') && (isSupplyStaff || isAdmin)) return true;
      return false;
    });
  };

  const visibleTabs = getVisibleTabs();

  return (
    <TooltipProvider>
      <div className="space-y-6 pb-20 md:pb-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate(-1)}
              className="h-9 w-9"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">Supplies</h1>
                <p className="text-sm text-muted-foreground">
                  {canManageInventory 
                    ? 'Manage inventory, requests, and fulfillment'
                    : 'Request and track office supplies'
                  }
                </p>
              </div>
            </div>
          </div>
          
          <Button onClick={() => navigate('/forms/supply-request')}>
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">New Request</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>

        {/* Quick Stats */}
        <div className={`grid gap-4 ${canManageInventory ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2'}`}>
          <Card 
            className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50"
            onClick={() => handleTabChange('my-requests')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <ClipboardList className="h-5 w-5 text-blue-600" />
                <Badge variant={activeRequestCount > 0 ? "default" : "secondary"}>
                  {activeRequestCount}
                </Badge>
              </div>
              <p className="text-sm font-medium mt-2">My Requests</p>
              <p className="text-xs text-muted-foreground">{myRequests.length} total</p>
            </CardContent>
          </Card>

          {canFulfillOrders && (
            <Card 
              className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50"
              onClick={() => handleTabChange('fulfillment')}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Truck className="h-5 w-5 text-green-600" />
                  <Badge variant="outline">Staff</Badge>
                </div>
                <p className="text-sm font-medium mt-2">Fulfillment</p>
                <p className="text-xs text-muted-foreground">Process orders</p>
              </CardContent>
            </Card>
          )}

          {canFulfillOrders && (
            <Card 
              className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50"
              onClick={() => handleTabChange('tasks')}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <ClipboardList className="h-5 w-5 text-amber-600" />
                  <Badge variant="outline">Staff</Badge>
                </div>
                <p className="text-sm font-medium mt-2">Tasks</p>
                <p className="text-xs text-muted-foreground">Assignments</p>
              </CardContent>
            </Card>
          )}

          {canManageInventory && (
            <Card 
              className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50"
              onClick={() => handleTabChange('inventory')}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Boxes className="h-5 w-5 text-purple-600" />
                  <Badge variant="outline">Staff</Badge>
                </div>
                <p className="text-sm font-medium mt-2">Inventory</p>
                <p className="text-xs text-muted-foreground">Manage stock</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className={`w-full grid grid-cols-${visibleTabs.length} h-auto p-1`}>
            {visibleTabs.map((tab) => (
              <Tooltip key={tab.id}>
                <TooltipTrigger asChild>
                  <TabsTrigger 
                    value={tab.id}
                    className="flex items-center gap-2 py-2"
                  >
                    {tab.icon}
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {tab.tooltip}
                </TooltipContent>
              </Tooltip>
            ))}
          </TabsList>

          {/* My Requests Tab */}
          <TabsContent value="my-requests" className="mt-6">
            <MySupplyRequestsContent />
          </TabsContent>

          {/* Fulfillment Tab (Supply Staff) */}
          {canFulfillOrders && (
            <TabsContent value="fulfillment" className="mt-6">
              <ImprovedSupplyStaffDashboard />
            </TabsContent>
          )}

          {/* Tasks Tab (Supply Staff) */}
          {canFulfillOrders && (
            <TabsContent value="tasks" className="mt-6">
              <StaffTasksTab />
            </TabsContent>
          )}

          {/* Inventory Tab */}
          {canManageInventory && (
            <TabsContent value="inventory" className="mt-6">
              <InventoryDashboard />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </TooltipProvider>
  );
}

// Embedded content components to avoid full page renders
function MySupplyRequestsContent() {
  const { user } = useAuth();
  const { data: requests = [], isLoading, refetch } = useSupplyRequests(user?.id);
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <Card className="p-8 text-center border-dashed">
        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="font-semibold mb-2">No Supply Requests</h3>
        <p className="text-sm text-muted-foreground mb-4">
          You haven't made any supply requests yet
        </p>
        <Button onClick={() => navigate('/forms/supply-request')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Your First Request
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Your Supply Requests</h2>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
      
      <div className="space-y-3">
        {requests.map((request: any) => (
          <Card key={request.id} className="hover:shadow-md transition-all hover:border-primary/30">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="font-medium">{request.title || 'Supply Request'}</h3>
                  <p className="text-sm text-muted-foreground">
                    {request.supply_request_items?.length || 0} items
                  </p>
                </div>
                <Badge 
                  variant={
                    request.status === 'completed' ? 'default' :
                    request.status === 'rejected' || request.status === 'cancelled' ? 'destructive' :
                    'secondary'
                  }
                >
                  {request.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
