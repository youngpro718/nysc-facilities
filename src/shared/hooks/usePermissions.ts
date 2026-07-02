/**
 * usePermissions Hook
 * 
 * Custom hook for checking user permissions
 * Now uses user_roles table exclusively
 * 
 * @module hooks/common/usePermissions
 */

import { useAuth } from '@features/auth/hooks/useAuth';
import { hasPermission, hasAnyPermission, hasAllPermissions, type Permission } from '@/lib/permissions';

export function usePermissions() {
  // The app role comes from the profile (user_roles table), NOT from the raw
  // Supabase auth user — user.role there is always the literal "authenticated",
  // which made every check in this hook silently fail.
  const { userRole } = useAuth();

  const can = (permission: Permission): boolean => {
    if (!userRole) return false;
    return hasPermission(userRole, permission);
  };

  const canAny = (permissions: Permission[]): boolean => {
    if (!userRole) return false;
    return hasAnyPermission(userRole, permissions);
  };

  const canAll = (permissions: Permission[]): boolean => {
    if (!userRole) return false;
    return hasAllPermissions(userRole, permissions);
  };

  return {
    can,
    canAny,
    canAll,
    role: userRole,
    isAdmin: userRole === 'admin' || userRole === 'system_admin',
    isSystemAdmin: userRole === 'admin' || userRole === 'system_admin',
    isFacilitiesManager: userRole === 'facilities_manager',
  };
}
