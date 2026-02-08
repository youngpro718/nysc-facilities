/**
 * SINGLE SOURCE OF TRUTH FOR ROLE SYSTEM
 * 
 * This file defines the 6 allowed roles in the system.
 * All UI components MUST import from this file.
 * 
 * DO NOT create role arrays anywhere else in the codebase.
 */

// The 4 simplified role values (matches database enum)
export type UserRole = 
  | 'standard'      // "User" in UI
  | 'court_aide'    // "Court Aide" in UI
  | 'cmc'           // "Management" in UI
  | 'admin';        // "Admin" in UI

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
    description: 'Basic access - can submit requests and report issues',
    color: 'gray',
  },
  {
    value: 'court_aide',
    label: 'Court Aide',
    description: 'Manages inventory, fulfills supply requests, completes tasks',
    color: 'green',
  },
  {
    value: 'cmc',
    label: 'Management',
    description: 'Court management, scheduling, and operations oversight',
    color: 'purple',
  },
  {
    value: 'admin',
    label: 'Administrator',
    description: 'Full system access and user management',
    color: 'red',
  },
] as const;

// Signup role options (for the signup form)
// Excludes admin — admin role can only be assigned by existing administrators
export const SIGNUP_ROLE_OPTIONS = SYSTEM_ROLES
  .filter(r => r.value !== 'admin')
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
    red: 'bg-red-500/10 text-red-700 border-red-500/20',
    blue: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
    green: 'bg-green-500/10 text-green-700 border-green-500/20',
    purple: 'bg-purple-500/10 text-purple-700 border-purple-500/20',
    orange: 'bg-orange-500/10 text-orange-700 border-orange-500/20',
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
