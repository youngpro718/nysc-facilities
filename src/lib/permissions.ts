// @ts-nocheck
/**
 * Permissions Configuration
 * 
 * Central configuration for role-based access control (RBAC)
 * 
 * @module lib/permissions
 */

export const USER_ROLES = {
  ADMIN: 'administrator',
  MANAGER: 'manager',
  FACILITIES_STAFF: 'facilities_staff',
  STAFF: 'staff',
  USER: 'user',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

/**
 * Permission definitions
 * Maps permissions to allowed roles
 */
export const PERMISSIONS = {
  // Facility permissions
  'facility.view': ['administrator', 'manager', 'facilities_staff', 'staff'],
  'facility.update_status': ['administrator', 'manager', 'facilities_staff'],
  'facility.edit': ['administrator', 'manager'],
  'facility.delete': ['administrator'],
  
  // Issue permissions
  'issue.view': ['administrator', 'manager', 'facilities_staff', 'staff'],
  'issue.create': ['administrator', 'manager', 'facilities_staff', 'staff'],
  'issue.assign': ['administrator', 'manager'],
  'issue.resolve': ['administrator', 'manager', 'facilities_staff'],
  'issue.delete': ['administrator'],
  
  // Audit trail permissions
  'audit.view': ['administrator', 'manager', 'facilities_staff'],
  
  // Admin permissions
  'admin.users': ['administrator'],
  'admin.settings': ['administrator'],
} as const;

export type Permission = keyof typeof PERMISSIONS;

/**
 * Check if a user role has a specific permission
 * @param userRole - User's role
 * @param permission - Permission to check
 * @returns true if user has permission
 */
export function hasPermission(userRole: string, permission: Permission): boolean {
  if (!userRole || !permission) return false;
  
  const allowedRoles = PERMISSIONS[permission];
  if (!allowedRoles) return false;
  
  return allowedRoles.includes(userRole as unknown);
}

/**
 * Check if user has any of the specified permissions
 * @param userRole - User's role
 * @param permissions - Array of permissions to check
 * @returns true if user has at least one permission
 */
export function hasAnyPermission(userRole: string, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission));
}

/**
 * Check if user has all of the specified permissions
 * @param userRole - User's role
 * @param permissions - Array of permissions to check
 * @returns true if user has all permissions
 */
export function hasAllPermissions(userRole: string, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission));
}

/**
 * Get all permissions for a role
 * @param userRole - User's role
 * @returns Array of permissions
 */
export function getRolePermissions(userRole: string): Permission[] {
  return Object.keys(PERMISSIONS).filter(permission =>
    hasPermission(userRole, permission as Permission)
  ) as Permission[];
}
