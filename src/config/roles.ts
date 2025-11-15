/**
 * SINGLE SOURCE OF TRUTH FOR ROLE SYSTEM
 * 
 * This file defines the 6 allowed roles in the system.
 * All UI components MUST import from this file.
 * 
 * DO NOT create role arrays anywhere else in the codebase.
 */

// The 6 allowed role values (matches database enum)
export type UserRole = 
  | 'standard'
  | 'cmc'
  | 'court_aide'
  | 'purchasing_staff'
  | 'facilities_manager'
  | 'admin';

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
    label: 'Standard User',
    description: 'Basic access - can report issues and make requests',
    color: 'gray',
  },
  {
    value: 'cmc',
    label: 'Court Management Coordinator',
    description: 'Manages court operations and scheduling',
    color: 'purple',
  },
  {
    value: 'court_aide',
    label: 'Court Aide',
    description: 'Manages inventory and fulfills supply requests',
    color: 'green',
  },
  {
    value: 'purchasing_staff',
    label: 'Purchasing Staff',
    description: 'Handles purchasing and procurement operations',
    color: 'orange',
  },
  {
    value: 'facilities_manager',
    label: 'Facility Coordinator',
    description: 'Manages building facilities and operations',
    color: 'blue',
  },
  {
    value: 'admin',
    label: 'Administrator',
    description: 'Full system access and user management',
    color: 'red',
  },
] as const;

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
