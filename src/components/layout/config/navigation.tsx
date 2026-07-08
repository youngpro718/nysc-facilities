
import { logger } from '@/lib/logger';
import {
  Settings,
  LayoutDashboard,
  Building2,
  AlertTriangle,
  Boxes,
  KeyRound,
  Gavel,
  UserCog,
  GitFork,
  Package,
  Package2,
  UserCheck,
  User,
  FileText,
  MessageSquare,
} from 'lucide-react';
import { NavigationTab, NavigationItem } from '../types';
import { RolePermissions, CourtRole } from '@features/auth/hooks/useRolePermissions';

// Define the navigation items for admin and user interfaces
export const navigationItems: NavigationItem[] = [
  {
    title: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    adminOnly: true,
    moduleKey: undefined, // Dashboard is always available
  },
  {
    title: 'User Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    adminOnly: false,
    moduleKey: undefined,
  },
  {
    title: 'Spaces',
    href: '/spaces',
    icon: Building2,
    adminOnly: true,
    moduleKey: 'spaces',
  },
  {
    title: 'Operations',
    href: '/operations',
    icon: AlertTriangle,
    adminOnly: false,
    moduleKey: 'operations',
  },
];


export const userNavigationItems: NavigationItem[] = [
  {
    title: 'Profile',
    href: '/profile',
    icon: User,
    adminOnly: false,
  },
  {
    title: 'Admin Center',
    href: '/admin',
    icon: UserCog,
    adminOnly: true,
  },
  {
    title: 'System Settings',
    href: '/system-settings',
    icon: Settings,
    adminOnly: true,
  },
  {
    title: 'Routing Rules',
    href: '/admin/routing-rules',
    icon: GitFork,
    adminOnly: true,
  },
  {
    title: 'Form Builder',
    href: '/admin/form-templates',
    icon: FileText,
    adminOnly: true,
  },
];

// Create filtered navigation based on role permissions
export function getRoleBasedNavigation(permissions: RolePermissions, userRole: CourtRole, profile?: Record<string, unknown>): NavigationTab[] {
  const dept = (profile?.departments as Record<string, unknown>)?.name || profile?.department;
  logger.debug(`Navigation - userRole: ${userRole}, profile department: ${dept}`);
  logger.debug('Navigation - profile title:', profile?.title as string);
  
  // System Admin / legacy Admin navigation (full access)
  if (userRole === 'admin' || userRole === 'system_admin') {
    return [
      { title: 'Dashboard', icon: LayoutDashboard },
      { title: 'Spaces', icon: Building2 },
      { title: 'Operations', icon: AlertTriangle },
      { title: 'Keys', icon: KeyRound },
      { title: 'Inventory', icon: Package2 },
      { title: 'Tasks', icon: Package },
      { title: 'Court Operations', icon: Gavel },
      { type: "separator" },
      { title: 'Admin Center', icon: UserCog },
    ];
  }

  // Facilities Manager navigation (facilities-focused, no user/system management)
  if (userRole === 'facilities_manager') {
    return [
      { title: 'Dashboard', icon: LayoutDashboard },
      { title: 'Spaces', icon: Building2 },
      { title: 'Operations', icon: AlertTriangle },
      { title: 'Keys', icon: KeyRound },
      { title: 'Inventory', icon: Package2 },
      { title: 'Tasks', icon: Package },
      { title: 'Term Sheet', icon: FileText },
      { type: "separator" },
      { title: 'Profile', icon: User },
    ];
  }
  
  // Court Liaison (term sheet maintainer) navigation
  if (userRole === 'court_liaison') {
    return [
      { title: 'Term Sheet', icon: FileText },
      { title: 'My Requests', icon: FileText },
      { title: 'Notifications', icon: MessageSquare },
      { type: "separator" },
      { title: 'Profile', icon: User },
    ];
  }

  // Court Officer (Major / Security) navigation. Keys + Reports for their
  // primary workflow; Courtrooms + Term Sheet so they can answer "where's
  // Judge Smith?" / "what's Part 30?" at the front desk.
  if (userRole === 'court_officer') {
    return [
      { title: 'Command Center', icon: LayoutDashboard },
      { title: 'Keys', icon: KeyRound },
      { title: 'Reports', icon: AlertTriangle },
      { title: 'Courtrooms', icon: Gavel },
      { title: 'Term Sheet', icon: FileText },
      { type: "separator" },
      { title: 'Profile', icon: User },
    ];
  }

  // Purchasing navigation - operational supply chain focus
  if (userRole === 'purchasing') {
    return [
      { title: 'Supply Room', icon: Package2 },
      { title: 'Inventory', icon: Boxes },
      { title: 'Tasks', icon: Package },
      { type: "separator" },
      { title: 'Profile', icon: User },
    ];
  }

  // Court Aide navigation - operations role: Work Center, Tasks, Supply Room, Inventory, Term Sheet
  if (userRole === 'court_aide') {
    return [
      { title: 'Work Center', icon: LayoutDashboard },
      { title: 'Tasks', icon: Package },
      { title: 'Supply Room', icon: Package2 },
      { title: 'Inventory', icon: Boxes },
      { title: 'Term Sheet', icon: FileText },
      { type: "separator" },
      { title: 'Profile', icon: User },
    ];
  }

  // Standard user navigation - actions are on dashboard, no separate request page needed
  return [
    { title: 'Dashboard', icon: LayoutDashboard },
    { title: 'My Requests', icon: FileText },
    { title: 'Term Sheet', icon: FileText },
    { title: 'Notifications', icon: MessageSquare },
    { type: "separator" },
    { title: 'Profile', icon: User },
  ];
}

// Legacy function for backwards compatibility
export function getAdminNavigation(): NavigationTab[] {
  return [
    { title: 'Dashboard', icon: LayoutDashboard },
    { title: 'Spaces', icon: Building2 },
    { title: 'Operations', icon: AlertTriangle },
    { type: "separator" },
    { title: 'Admin Center', icon: UserCog },
  ];
}

// Legacy export for backwards compatibility
export const adminNavigation: NavigationTab[] = getAdminNavigation();

export const userNavigation: NavigationTab[] = [
  { title: 'Dashboard', icon: LayoutDashboard },
  { title: 'My Requests', icon: FileText },
  { title: 'Term Sheet', icon: FileText },
  { type: "separator" },
  { title: 'Profile', icon: User },
];

// Helper function to get navigation routes based on role permissions
export const getNavigationRoutes = (permissions: RolePermissions, userRole: CourtRole, profile?: Record<string, unknown>): string[] => {
  const dept = (profile?.departments as Record<string, unknown>)?.name || profile?.department;
  logger.debug(`Routes - userRole: ${userRole}, profile department: ${dept}`);
  logger.debug('Routes - profile title:', profile?.title as string);
  
  // System Admin / legacy Admin routes (full access)
  if (userRole === 'admin' || userRole === 'system_admin') {
    return [
      '/', // Admin Dashboard
      '/spaces',
      '/operations', // Operations tab (Issues/Maintenance/Lighting consolidated)
      '/keys',
      '/inventory',
      '/tasks',
      '/term-sheet', // Court Operations
      '',          // separator placeholder
      '/admin',
    ];
  }

  // Facilities Manager routes (facilities-focused, no /admin or /system-settings)
  if (userRole === 'facilities_manager') {
    return [
      '/', // Facilities Dashboard
      '/spaces',
      '/operations', // Operations tab (Issues/Maintenance/Lighting consolidated)
      '/keys',
      '/inventory',
      '/tasks',
      '/term-sheet',
      '', // Separator
      '/profile',
    ];
  }
  
  // Court Liaison routes
  if (userRole === 'court_liaison') {
    return [
      '/term-sheet',
      '/my-activity',
      '/notifications',
      '', // Separator
      '/profile',
    ];
  }

  // Court Officer (Major / Security) routes — keys + reports + read-only
  // courtroom directory + the shared Term Sheet view.
  if (userRole === 'court_officer') {
    return [
      '/command-center',
      '/keys',
      '/my-issues',
      '/courtrooms',
      '/term-sheet',
      '', // Separator
      '/profile',
    ];
  }

  // Purchasing routes - operational supply chain focus
  if (userRole === 'purchasing') {
    return [
      '/supply-room',
      '/inventory',
      '/tasks',
      '', // Separator
      '/profile',
    ];
  }

  // Court Aide routes - operations role
  if (userRole === 'court_aide') {
    return [
      '/work-center',
      '/tasks',
      '/supply-room',
      '/inventory',
      '/term-sheet',
    ];
  }

  // Standard user routes - actions are on dashboard
  return [
    '/dashboard', // User Dashboard
    '/my-activity',
    '/term-sheet',
    '/notifications',
    '', // Separator
    '/profile',
  ];
};

// Function to get filtered navigation items based on role permissions
export function getFilteredNavigationItems(permissions: RolePermissions, userRole: CourtRole): NavigationItem[] {
  const isAdminTier = userRole === 'admin' || userRole === 'system_admin' || userRole === 'facilities_manager';
  // Roles whose default landing is NOT a dashboard route
  const noDashboardRoles: CourtRole[] = ['purchasing', 'court_officer', 'court_liaison'];
  const hasDashboard = !noDashboardRoles.includes(userRole);

  return navigationItems.filter(item => {
    // Dashboard routing: admin-tier sees only '/', dashboard-eligible non-admins see '/dashboard'
    if (item.href === '/') return isAdminTier;
    if (item.href === '/dashboard') return !isAdminTier && hasDashboard;

    // Check role permissions for feature-based items
    if (item.moduleKey && item.moduleKey in permissions) {
      return permissions[item.moduleKey as keyof RolePermissions] !== null;
    }

    // For non-module items, use existing admin logic
    if (item.adminOnly && !isAdminTier) return false;

    return true;
  });
}
