/**
 * usePermissions Hook
 * 
 * Custom hook for checking user permissions
 * 
 * @module hooks/common/usePermissions
 */

import { useAuth } from '@/hooks/useAuth';
import { hasPermission, hasAnyPermission, hasAllPermissions, type Permission } from '@/lib/permissions';

export function usePermissions() {
  const { user } = useAuth();
  
  const can = (permission: Permission): boolean => {
    if (!user?.role) return false;
    return hasPermission(user.role, permission);
  };
  
  const canAny = (permissions: Permission[]): boolean => {
    if (!user?.role) return false;
    return hasAnyPermission(user.role, permissions);
  };
  
  const canAll = (permissions: Permission[]): boolean => {
    if (!user?.role) return false;
    return hasAllPermissions(user.role, permissions);
  };
  
  return {
    can,
    canAny,
    canAll,
    role: user?.role,
    isAdmin: user?.role === 'administrator',
    isManager: user?.role === 'manager',
    isFacilitiesStaff: user?.role === 'facilities_staff',
  };
}
