import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { 
  Package, 
  ClipboardList,
  RefreshCcw
} from 'lucide-react';
import { InventoryManagement } from './InventoryManagement';
import { SupplyRequestTracking } from './SupplyRequestTracking';

export function EnhancedSupplyRoomDashboard() {
  const { user } = useAuth();
  const { userRole, permissions } = useRolePermissions();
  const [activeTab, setActiveTab] = useState('requests');

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

  const role = getSupplyRole();
  const isSupplyStaff = role === 'supply_staff' || role === 'supply_manager';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Supply Room</h1>
          <p className="text-muted-foreground mt-2">
            {isSupplyStaff
              ? "Receive and complete supply orders"
              : "View your supply requests"}
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => window.location.reload()}
        >
          <RefreshCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="requests">
            <ClipboardList className="h-4 w-4 mr-2" />
            Orders
          </TabsTrigger>
          {isSupplyStaff && (
            <TabsTrigger value="inventory">
              <Package className="h-4 w-4 mr-2" />
              Inventory
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="requests" className="space-y-4">
          <SupplyRequestTracking userRole={role} />
        </TabsContent>

        {isSupplyStaff && (
          <TabsContent value="inventory" className="space-y-4">
            <InventoryManagement />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}