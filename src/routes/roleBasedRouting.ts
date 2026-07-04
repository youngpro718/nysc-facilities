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
  system_admin: {
    path: '/',
    name: 'Admin Dashboard',
  },
  admin: {
    path: '/',
    name: 'Admin Dashboard',
  },
  facilities_manager: {
    path: '/',
    name: 'Facilities Dashboard',
  },
  court_liaison: {
    path: '/term-sheet',
    name: 'Court Management Dashboard',
  },
  court_officer: {
    path: '/command-center',
    name: 'Command Center',
  },
  purchasing: {
    path: '/supply-room',
    name: 'Supply Room',
  },
  court_aide: {
    path: '/work-center',
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
  return role === 'admin' || role === 'system_admin' || role === 'facilities_manager';
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
    spaces: ['admin', 'system_admin', 'facilities_manager'],
    operations: ['admin', 'system_admin', 'facilities_manager', 'court_liaison'],
    occupants: ['admin', 'system_admin', 'facilities_manager', 'court_liaison'],
    inventory: ['admin', 'system_admin', 'facilities_manager', 'purchasing', 'court_aide'],
    tasks: ['admin', 'system_admin', 'facilities_manager', 'purchasing', 'court_aide'],
    term_sheet: ['admin', 'system_admin', 'facilities_manager', 'court_liaison', 'court_aide', 'purchasing', 'standard'],
    // Gates the /supply-room fulfiller page. Standard users order via the
    // (unguarded) /request/supplies + /my-supply-requests flow, so they are
    // intentionally NOT here — they shouldn't see the fulfiller dashboard.
    supply_requests: ['admin', 'system_admin', 'facilities_manager', 'court_liaison', 'purchasing', 'court_aide'],
    keys: ['admin', 'system_admin', 'facilities_manager', 'court_liaison', 'court_officer'],
    maintenance: ['admin', 'system_admin', 'facilities_manager'],
    court_operations: ['admin', 'system_admin', 'court_liaison'],
    dashboard: ['admin', 'system_admin', 'facilities_manager', 'court_liaison', 'standard'],
  };
  
  const allowedRoles = moduleAccess[moduleKey] || [];
  return allowedRoles.includes(role as UserRole);
}
