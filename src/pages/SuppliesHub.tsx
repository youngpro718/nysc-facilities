/**
 * SUPPLIES HUB - Unified Supply Management
 * 
 * Consolidates all supply-related functionality:
 * - My Requests (for all users)
 * - All Requests (for staff/admin)
 * - Inventory Management (for staff/admin)
 * - Fulfillment (for supply staff)
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

// Import existing components
import MySupplyRequests from "@/pages/MySupplyRequests";
import { InventoryDashboard } from "@/pages/InventoryDashboard";
import { ImprovedSupplyStaffDashboard } from "@/components/supply/ImprovedSupplyStaffDashboard";

export default function SuppliesHub() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { permissions, userRole } = useRolePermissions();
  
  // Determine user access level
  const isSupplyStaff = userRole === 'court_aide' || userRole === 'purchasing_staff';
  const isAdmin = userRole === 'admin' || userRole === 'facilities_manager';
  const canManageInventory = isSupplyStaff || isAdmin;
  const canFulfillOrders = isSupplyStaff || isAdmin;
  
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

  return (
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
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Package className="h-6 w-6" />
              Supplies
            </h1>
            <p className="text-sm text-muted-foreground">
              {canManageInventory 
                ? 'Manage inventory, requests, and fulfillment'
                : 'Request and track office supplies'
              }
            </p>
          </div>
        </div>
        
        <Button onClick={() => navigate('/forms/supply-request')}>
          <Plus className="h-4 w-4 mr-2" />
          New Request
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
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
            className="cursor-pointer hover:shadow-md transition-shadow"
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

        {canManageInventory && (
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
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

        {isAdmin && (
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleTabChange('all-requests')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Package className="h-5 w-5 text-orange-600" />
                <Badge variant="outline">Admin</Badge>
              </div>
              <p className="text-sm font-medium mt-2">All Requests</p>
              <p className="text-xs text-muted-foreground">Admin view</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className={`w-full grid ${
          isAdmin ? 'grid-cols-4' : 
          canFulfillOrders ? 'grid-cols-3' : 
          'grid-cols-1'
        }`}>
          <TabsTrigger value="my-requests">
            <ClipboardList className="h-4 w-4 mr-2" />
            My Requests
          </TabsTrigger>
          
          {canFulfillOrders && (
            <TabsTrigger value="fulfillment">
              <Truck className="h-4 w-4 mr-2" />
              Fulfillment
            </TabsTrigger>
          )}
          
          {canManageInventory && (
            <TabsTrigger value="inventory">
              <Boxes className="h-4 w-4 mr-2" />
              Inventory
            </TabsTrigger>
          )}
          
          {isAdmin && (
            <TabsTrigger value="all-requests">
              <Package className="h-4 w-4 mr-2" />
              All Requests
            </TabsTrigger>
          )}
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

        {/* Inventory Tab */}
        {canManageInventory && (
          <TabsContent value="inventory" className="mt-6">
            <InventoryContent />
          </TabsContent>
        )}

        {/* All Requests Tab (Admin) */}
        {isAdmin && (
          <TabsContent value="all-requests" className="mt-6">
            <AllRequestsContent />
          </TabsContent>
        )}
      </Tabs>
    </div>
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
      <Card className="p-8 text-center">
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
          <Card key={request.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium">{request.title || 'Supply Request'}</h3>
                  <p className="text-sm text-muted-foreground">
                    {request.supply_request_items?.length || 0} items • Status: {request.status}
                  </p>
                </div>
                <Badge variant="outline">{request.status}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function InventoryContent() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Inventory Management</CardTitle>
          <CardDescription>
            View and manage supply inventory levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InventoryDashboard />
        </CardContent>
      </Card>
    </div>
  );
}

function AllRequestsContent() {
  const navigate = useNavigate();
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>All Supply Requests</CardTitle>
          <CardDescription>
            Administrative view of all supply requests across the organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate('/admin/supply-requests')}>
            Open Full Admin View
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
