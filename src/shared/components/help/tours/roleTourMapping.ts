import { UserRole } from '@/config/roles';

/**
 * Maps user roles to the tours they should have access to.
 * This ensures users only see tours relevant to their permissions.
 */
export const ROLE_TOUR_ACCESS: Record<UserRole, string[]> = {
  admin: [
    'admin-dashboard',
    'spaces',
    'operations',
    'court-ops',
    'keys',
    'inventory',
    'access',
    'user-dashboard',
    'tasks',
    'supply-room',
    'profile',
    'my-activity',
    'request-hub',
  ],
  
  system_admin: [
    'admin-dashboard',
    'spaces',
    'operations',
    'court-ops',
    'keys',
    'inventory',
    'access',
    'user-dashboard',
    'tasks',
    'supply-room',
    'profile',
    'my-activity',
    'request-hub',
  ],
  
  facilities_manager: [
    'admin-dashboard',
    'spaces',
    'operations',
    'keys',
    'inventory',
    'access',
    'user-dashboard',
    'tasks',
    'profile',
    'my-activity',
    'request-hub',
  ],
  
  cmc: [
    'cmc-dashboard',
    'court-ops',
    'spaces', // Read-only access for planning
    'user-dashboard',
    'profile',
    'my-activity',
    'request-hub',
  ],
  
  court_officer: [
    'court-officer-dashboard',
    'operations',
    'keys',
    'tasks',
    'user-dashboard',
    'profile',
    'my-activity',
    'request-hub',
  ],
  
  court_aide: [
    'court-aide-dashboard',
    'supply-room',
    'inventory',
    'tasks',
    'user-dashboard',
    'profile',
    'my-activity',
    'request-hub',
  ],
  
  purchasing: [
    'user-dashboard',
    'inventory',
    'supply-room', // View supply requests
    'profile',
    'my-activity',
    'request-hub',
  ],
  
  standard: [
    'user-dashboard',
    'profile',
    'my-activity',
    'request-hub',
  ],
};

/**
 * Check if a user role has access to a specific tour
 */
export function canAccessTour(userRole: UserRole | null, tourId: string): boolean {
  if (!userRole) return false;
  return ROLE_TOUR_ACCESS[userRole]?.includes(tourId) ?? false;
}

/**
 * Get all tours accessible by a user role
 */
export function getToursForRole(userRole: UserRole | null): string[] {
  if (!userRole) return ROLE_TOUR_ACCESS.standard;
  return ROLE_TOUR_ACCESS[userRole] ?? ROLE_TOUR_ACCESS.standard;
}
