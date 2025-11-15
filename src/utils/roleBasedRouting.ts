/**
 * Role-Based Dashboard Routing
 * 
 * Maps each of the 5 roles to their appropriate dashboard
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
  facilities_manager: {
    path: '/',
    name: 'Facilities Dashboard',
  },
  cmc: {
    path: '/cmc-dashboard',
    name: 'Court Management Dashboard',
  },
  court_aide: {
    path: '/court-aide-dashboard',
    name: 'Court Aide Dashboard',
  },
  purchasing_staff: {
    path: '/purchasing-dashboard',
    name: 'Purchasing Dashboard',
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
  return role === 'admin' || role === 'facilities_manager';
}

/**
 * Check if a role has access to a specific module
 */
export function hasModuleAccess(role: UserRole | string | null | undefined, moduleKey: string): boolean {
  if (!role) return false;
  
  // Admin and facilities_manager have access to everything
  if (isAdminRole(role)) return true;
  
  // Role-specific module access
  const moduleAccess: Record<string, UserRole[]> = {
    spaces: ['admin', 'facilities_manager'],
    operations: ['admin', 'facilities_manager', 'cmc'],
    occupants: ['admin', 'facilities_manager', 'cmc'],
    inventory: ['admin', 'facilities_manager', 'court_aide', 'purchasing_staff'],
    supply_requests: ['admin', 'facilities_manager', 'court_aide', 'purchasing_staff', 'cmc'],
    keys: ['admin', 'facilities_manager', 'cmc'],
    lighting: ['admin', 'facilities_manager'],
    maintenance: ['admin', 'facilities_manager'],
    court_operations: ['admin', 'facilities_manager', 'cmc'],
    dashboard: ['admin', 'facilities_manager', 'cmc', 'court_aide', 'purchasing_staff', 'standard'],
  };
  
  const allowedRoles = moduleAccess[moduleKey] || [];
  return allowedRoles.includes(role as UserRole);
}
