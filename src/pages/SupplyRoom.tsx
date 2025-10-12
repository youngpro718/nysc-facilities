import React from 'react';
import { EnhancedSupplyRoomDashboard } from '@/components/supply/EnhancedSupplyRoomDashboard';
import { useAuth } from '@/hooks/useAuth';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export default function SupplyRoom() {
  const { user, profile, isLoading } = useAuth();
  const { hasPermission, loading: permissionsLoading } = useRolePermissions();

  // Check if user has supply room permissions
  const canManageSupplyRequests = hasPermission('supply_requests', 'admin') || hasPermission('supply_requests', 'write');
  const canManageInventory = hasPermission('inventory', 'admin') || hasPermission('inventory', 'write');
  
  // Also allow access for users assigned to Supply Department
  const isSupplyDepartmentUser = (profile as any)?.department === 'Supply Department';
  
  // Debug logging
  console.log('SupplyRoom Debug:', {
    isLoading,
    permissionsLoading,
    canManageSupplyRequests,
    canManageInventory,
    isSupplyDepartmentUser,
    department: (profile as any)?.department,
    profile
  });

  // Show loading state while checking permissions
  if (isLoading || permissionsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <div className="animate-pulse text-muted-foreground">Loading permissions...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!canManageSupplyRequests && !canManageInventory && !isSupplyDepartmentUser) {
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
      <EnhancedSupplyRoomDashboard />
    </div>
  );
}
