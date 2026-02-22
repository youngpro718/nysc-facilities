/**
 * Permissions Configuration
 *
 * Central configuration for role-based access control (RBAC).
 * Roles must match those stored in the user_roles table:
 *   admin | cmc | court_aide | standard
 */

export const USER_ROLES = {
  ADMIN: 'admin',
  CMC: 'cmc',
  COURT_AIDE: 'court_aide',
  STANDARD: 'standard',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

/**
 * Permission definitions
 * Maps permissions to allowed roles
 */
export const PERMISSIONS = {
  // Facility permissions
  'facility.view': ['admin', 'cmc', 'court_aide', 'standard'],
  'facility.update_status': ['admin', 'cmc', 'court_aide'],
  'facility.edit': ['admin', 'cmc'],
  'facility.delete': ['admin'],

  // Issue permissions
  'issue.view': ['admin', 'cmc', 'court_aide', 'standard'],
  'issue.create': ['admin', 'cmc', 'court_aide', 'standard'],
  'issue.assign': ['admin', 'cmc'],
  'issue.resolve': ['admin', 'cmc', 'court_aide'],
  'issue.delete': ['admin'],

  // Audit trail permissions
  'audit.view': ['admin', 'cmc', 'court_aide'],

  // Admin permissions
  'admin.users': ['admin'],
  'admin.settings': ['admin'],
} as const;

export type Permission = keyof typeof PERMISSIONS;

/**
 * Check if a user role has a specific permission
 */
export function hasPermission(userRole: string, permission: Permission): boolean {
  if (!userRole || !permission) return false;

  const allowedRoles = PERMISSIONS[permission] as readonly string[];
  if (!allowedRoles) return false;

  return allowedRoles.includes(userRole);
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(userRole: string, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission));
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(userRole: string, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission));
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(userRole: string): Permission[] {
  return (Object.keys(PERMISSIONS) as Permission[]).filter(permission =>
    hasPermission(userRole, permission)
  );
}
