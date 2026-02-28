// Supply Room — staff dashboard for supply management
import React from 'react';
import { logger } from '@/lib/logger';
import { ImprovedSupplyStaffDashboard } from '@/components/supply/ImprovedSupplyStaffDashboard';
import { useAuth } from '@/hooks/useAuth';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EnhancedAccessDenied } from '@/components/common/EnhancedAccessDenied';
import { AlertTriangle } from 'lucide-react';
import { Breadcrumb } from '@/components/layout/Breadcrumb';

export default function SupplyRoom() {
  const { user, profile, isLoading } = useAuth();
  const { hasPermission, loading: permissionsLoading } = useRolePermissions();

  // Check if user has supply room permissions
  const canManageSupplyRequests = hasPermission('supply_requests', 'admin') || hasPermission('supply_requests', 'write');
  const canManageInventory = hasPermission('inventory', 'admin') || hasPermission('inventory', 'write');
  
  // Also allow access for users assigned to Supply Department
  const isSupplyDepartmentUser = (profile as any)?.department === 'Supply Department';
  
  // Debug logging
  logger.debug('SupplyRoom Debug:', {
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
        <Breadcrumb />
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
      <EnhancedAccessDenied
        title="Supply Room Access Restricted"
        description="You don't have permission to access the Supply Room. This area is restricted to supply room staff and authorized personnel."
        requiredPermissions={[
          'Supply Room Staff role',
          'Supply Requests permission (write or admin)',
          'Assignment to Supply Department'
        ]}
        currentPermissions={{
          'Supply Requests': canManageSupplyRequests ? 'admin' : null,
          'Inventory': canManageInventory ? 'admin' : null,
          'Department': (profile as any)?.department || 'Not assigned',
        }}
        contactEmail="support@nysc.gov"
        showRequestAccess={true}
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb />
      <ImprovedSupplyStaffDashboard />
    </div>
  );
}
