/**
 * usePermissions Hook
 * 
 * Custom hook for checking user permissions
 * Now uses user_roles table exclusively
 * 
 * @module hooks/common/usePermissions
 */

import { useAuth } from '@/hooks/useAuth';
import { hasPermission, hasAnyPermission, hasAllPermissions, type Permission } from '@/lib/permissions';

export function usePermissions() {
  const { user } = useAuth();
  
  // user.role now comes from user_roles table via useAuth hook
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
    isAdmin: user?.role === 'administrator' || user?.role === 'admin',
    isManager: user?.role === 'manager',
    isFacilitiesStaff: user?.role === 'facilities_staff',
  };
}
