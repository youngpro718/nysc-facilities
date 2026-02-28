/**
 * Role-Based Dashboard Routing
 * 
 * Maps each of the 4 roles to their appropriate dashboard
 */

import type { UserRole } from '@/config/roles';

export interface DashboardRoute {
  path: string;
  name: string;
}

// Map roles to their default dashboard
export const ROLE_DASHBOARDS: Record<UserRole, DashboardRoute> = {
  admin: {
    path: '/',
    name: 'Admin Dashboard',
  },
  cmc: {
    path: '/cmc-dashboard',
    name: 'Court Management Dashboard',
  },
  court_officer: {
    path: '/court-officer-dashboard',
    name: 'Court Officer Dashboard',
  },
  court_aide: {
    path: '/court-aide-dashboard',
    name: 'Work Center',
  },
  standard: {
    path: '/dashboard',
    name: 'User Dashboard',
  },
};

/**
 * Get the default dashboard path for a given role
 */
export function getDashboardForRole(role: UserRole | string | null | undefined): string {
  if (!role) return '/dashboard'; // Default for no role
  
  const dashboard = ROLE_DASHBOARDS[role as UserRole];
  return dashboard ? dashboard.path : '/dashboard';
}

/**
 * Get the dashboard name for a given role
 */
export function getDashboardNameForRole(role: UserRole | string | null | undefined): string {
  if (!role) return 'Dashboard';
  
  const dashboard = ROLE_DASHBOARDS[role as UserRole];
  return dashboard ? dashboard.name : 'Dashboard';
}

/**
 * Check if a role has admin-level access
 */
export function isAdminRole(role: UserRole | string | null | undefined): boolean {
  return role === 'admin';
}

/**
 * Check if a role has access to a specific module
 */
export function hasModuleAccess(role: UserRole | string | null | undefined, moduleKey: string): boolean {
  if (!role) return false;
  
  // Admin has access to everything
  if (isAdminRole(role)) return true;
  
  // Role-specific module access
  const moduleAccess: Record<string, UserRole[]> = {
    spaces: ['admin', 'court_officer'],
    operations: ['admin', 'cmc'],
    occupants: ['admin', 'cmc'],
    inventory: ['admin', 'court_aide'],
    supply_requests: ['admin', 'court_aide', 'cmc', 'standard'],
    keys: ['admin', 'cmc', 'court_officer'],
    lighting: ['admin'],
    maintenance: ['admin'],
    court_operations: ['admin', 'cmc'],
    dashboard: ['admin', 'cmc', 'court_officer', 'court_aide', 'standard'],
  };
  
  const allowedRoles = moduleAccess[moduleKey] || [];
  return allowedRoles.includes(role as UserRole);
}
