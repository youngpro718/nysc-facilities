import { ReactNode } from 'react';
import { useRolePermissions, PermissionLevel, RolePermissions } from '@/hooks/useRolePermissions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock } from 'lucide-react';

interface RoleBasedRouteProps {
  children: ReactNode;
  feature: keyof RolePermissions;
  requiredLevel?: PermissionLevel;
  fallback?: ReactNode;
}

export function RoleBasedRoute({ 
  children, 
  feature, 
  requiredLevel = 'read',
  fallback 
}: RoleBasedRouteProps) {
  const { hasPermission, loading, userRole } = useRolePermissions();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading permissions...</div>
      </div>
    );
  }

  if (!hasPermission(feature, requiredLevel)) {
    if (fallback) return <>{fallback}</>;
    
    return (
      <div className="container mx-auto p-6">
        <Alert className="max-w-md mx-auto">
          <Lock className="h-4 w-4" />
          <AlertDescription>
            You don't have sufficient permissions to access this feature.
            {userRole && ` Your role: ${userRole.replace(/_/g, ' ')}`}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
}