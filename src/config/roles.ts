/**
 * SINGLE SOURCE OF TRUTH FOR ROLE SYSTEM
 * 
 * This file defines the 6 allowed roles in the system.
 * All UI components MUST import from this file.
 * 
 * DO NOT create role arrays anywhere else in the codebase.
 */

// The system role values (matches database enum)
export type UserRole =
  | 'standard'             // "User" in UI
  | 'court_aide'           // "Court Aide" in UI
  | 'court_officer'        // "Court Officer" in UI
  | 'purchasing'           // "Purchasing" in UI
  | 'cmc'                  // "Management" in UI
  | 'facilities_manager'   // "Facilities Manager" in UI
  | 'system_admin'         // "System Admin" in UI
  | 'admin';               // Legacy alias → treated as system_admin

// Role configuration with labels and descriptions
export interface RoleConfig {
  value: UserRole;
  label: string;
  description: string;
  color: string; // For badge colors
}

// THE CANONICAL ROLE LIST - Import this everywhere
export const SYSTEM_ROLES: readonly RoleConfig[] = [
  {
    value: 'standard',
    label: 'User',
    description: 'Report issues, request supplies, and request keys for your workspace',
    color: 'gray',
  },
  {
    value: 'court_aide',
    label: 'Court Aide',
    description: 'Fulfill supply orders, manage inventory stock, and complete facility tasks',
    color: 'green',
  },
  {
    value: 'court_officer',
    label: 'Court Officer',
    description: 'Manage building keys, access facility layouts, and oversee security',
    color: 'blue',
  },
  {
    value: 'purchasing',
    label: 'Purchasing',
    description: 'Track inventory levels, monitor supply requests, and manage procurement',
    color: 'orange',
  },
  {
    value: 'cmc',
    label: 'Court Management Coordinator',
    description: 'Oversee court operations, manage courtroom scheduling, and coordinate terms',
    color: 'purple',
  },
  {
    value: 'facilities_manager',
    label: 'Facilities Manager',
    description: 'Manage spaces, operations, keys, inventory, and maintenance',
    color: 'amber',
  },
  {
    value: 'system_admin',
    label: 'System Admin',
    description: 'Full system access — manage users, settings, and all operations',
    color: 'red',
  },
  {
    value: 'admin',
    label: 'Administrator',
    description: 'Full system access (legacy — same as System Admin)',
    color: 'red',
  },
] as const;

// Signup role options (for the signup form)
// Excludes admin — admin role can only be assigned by existing administrators
// Court Officer is included so officers of all levels can request the role (admin approval required)
// Excludes admin-tier roles — those can only be assigned by existing administrators
export const SIGNUP_ROLE_OPTIONS = SYSTEM_ROLES
  .filter(r => !(['admin', 'system_admin', 'facilities_manager'] as string[]).includes(r.value))
  .map(r => ({
    value: r.value,
    label: r.label,
    description: r.description,
  }));

// Helper functions
export function getRoleLabel(roleValue: UserRole | string | null | undefined): string {
  if (!roleValue) return 'No Role';
  const role = SYSTEM_ROLES.find(r => r.value === roleValue);
  return role ? role.label : roleValue.replace(/_/g, ' ');
}

export function getRoleDescription(roleValue: UserRole | string | null | undefined): string {
  if (!roleValue) return '';
  const role = SYSTEM_ROLES.find(r => r.value === roleValue);
  return role ? role.description : '';
}

export function getRoleColor(roleValue: UserRole | string | null | undefined): string {
  if (!roleValue) return 'gray';
  const role = SYSTEM_ROLES.find(r => r.value === roleValue);
  return role ? role.color : 'gray';
}

export function getRoleBadgeClasses(roleValue: UserRole | string | null | undefined): string {
  const color = getRoleColor(roleValue);

  const colorMap: Record<string, string> = {
    red: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
    blue: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
    green: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
    purple: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
    orange: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
    amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
    gray: 'bg-gray-500/10 text-gray-700 border-gray-500/20',
  };

  return colorMap[color] || colorMap.gray;
}

// Validation
export function isValidRole(role: string | null | undefined): role is UserRole {
  if (!role) return false;
  return SYSTEM_ROLES.some(r => r.value === role);
}

// For forms/selects - returns array format
export function getRoleOptions(): Array<{ value: UserRole; label: string; description: string }> {
  return SYSTEM_ROLES.map(r => ({
    value: r.value,
    label: r.label,
    description: r.description,
  }));
}
