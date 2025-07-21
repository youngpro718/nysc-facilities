import React from 'react';
import { SupplyRoomDashboard } from '@/components/supply/SupplyRoomDashboard';
import { useAuth } from '@/hooks/useAuth';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export default function SupplyRoom() {
  const { user } = useAuth();
  const { hasPermission } = useRolePermissions();

  // Check if user has supply room permissions
  const canManageSupplyRequests = hasPermission('supply_requests', 'admin') || hasPermission('supply_requests', 'write');
  const canManageInventory = hasPermission('inventory', 'admin') || hasPermission('inventory', 'write');

  if (!canManageSupplyRequests && !canManageInventory) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Access Restricted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You don't have permission to access the supply room. Please contact your administrator 
              if you need access to supply request management features.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <SupplyRoomDashboard />
    </div>
  );
}
