
import {
  Settings,
  LayoutDashboard,
  Zap,
  AlertTriangle,
  Users,
  Building2,
  KeyRound,
  User,
  UserCog,
  FileText,
  MessageSquare,
  Wrench,
  Gavel,
  Package,
  Boxes,
} from 'lucide-react';
import { NavigationTab, NavigationItem } from '../types';
import { EnabledModules } from '@/hooks/useEnabledModules';

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
    title: 'Issues',
    href: '/issues',
    icon: AlertTriangle,
    adminOnly: true,
    moduleKey: 'issues',
  },
  {
    title: 'Occupants',
    href: '/occupants',
    icon: Users,
    adminOnly: true,
    moduleKey: 'occupants',
  },
  {
    title: 'Inventory',
    href: '/inventory',
    icon: Boxes,
    adminOnly: true,
    moduleKey: 'inventory',
  },
  {
    title: 'Supply Requests',
    href: '/admin/supply-requests',
    icon: Package,
    adminOnly: true,
    moduleKey: 'supply_requests',
  },
  {
    title: 'Keys',
    href: '/keys',
    icon: KeyRound,
    adminOnly: true,
    moduleKey: 'keys',
  },
  {
    title: 'Lighting',
    href: '/lighting',
    icon: Zap,
    adminOnly: true,
    moduleKey: 'lighting',
  },
  {
    title: 'Maintenance',
    href: '/maintenance',
    icon: Wrench,
    adminOnly: true,
    moduleKey: 'maintenance',
  },
  {
    title: 'Court Operations',
    href: '/court-operations',
    icon: Gavel,
    adminOnly: true,
    moduleKey: 'court_operations',
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
    title: 'Admin Profile',
    href: '/admin-profile',
    icon: UserCog,
    adminOnly: true,
  },
];

// Create filtered navigation based on enabled modules
export function getAdminNavigation(enabledModules?: EnabledModules): NavigationTab[] {
  const baseNavigation: NavigationTab[] = [
    { title: 'Dashboard', icon: LayoutDashboard }, // Always visible
  ];

  const moduleNavigation: Array<NavigationTab & { moduleKey?: keyof EnabledModules }> = [
    { title: 'Spaces', icon: Building2, moduleKey: 'spaces' },
    { title: 'Issues', icon: AlertTriangle, moduleKey: 'issues' },
    { title: 'Occupants', icon: Users, moduleKey: 'occupants' },
    { title: 'Inventory', icon: Boxes, moduleKey: 'inventory' },
    { title: 'Supply Requests', icon: Package, moduleKey: 'supply_requests' },
    { title: 'Keys', icon: KeyRound, moduleKey: 'keys' },
    { title: 'Lighting', icon: Zap, moduleKey: 'lighting' },
    { title: 'Maintenance', icon: Wrench, moduleKey: 'maintenance' },
    { title: 'Court Operations', icon: Gavel, moduleKey: 'court_operations' },
  ];

  // Filter based on enabled modules
  const filteredModules = moduleNavigation.filter(nav => 
    !enabledModules || !nav.moduleKey || enabledModules[nav.moduleKey]
  );

  return [
    ...baseNavigation,
    ...filteredModules,
    { type: "separator" },
    { title: 'Admin Profile', icon: UserCog },
  ];
}

// Legacy export for backwards compatibility
export const adminNavigation: NavigationTab[] = getAdminNavigation();

export const userNavigation: NavigationTab[] = [
  { title: 'Dashboard', icon: LayoutDashboard },
  { title: 'My Requests', icon: FileText },
  { title: 'My Issues', icon: MessageSquare },
  { type: "separator" },
  { title: 'Profile', icon: User },
];

// Helper function to get navigation routes based on admin status and enabled modules
export const getNavigationRoutes = (isAdmin: boolean, enabledModules?: EnabledModules): string[] => {
  if (isAdmin) {
    const baseRoutes = ['/']; // Dashboard always available
    const moduleRoutes: Array<{ route: string; moduleKey?: keyof EnabledModules }> = [
      { route: '/spaces', moduleKey: 'spaces' },
      { route: '/issues', moduleKey: 'issues' },
      { route: '/occupants', moduleKey: 'occupants' },
      { route: '/inventory', moduleKey: 'inventory' },
      { route: '/admin/supply-requests', moduleKey: 'supply_requests' },
      { route: '/keys', moduleKey: 'keys' },
      { route: '/lighting', moduleKey: 'lighting' },
      { route: '/maintenance', moduleKey: 'maintenance' },
      { route: '/court-operations', moduleKey: 'court_operations' },
    ];

    // Filter routes based on enabled modules
    const filteredRoutes = moduleRoutes
      .filter(route => !enabledModules || !route.moduleKey || enabledModules[route.moduleKey])
      .map(route => route.route);

    return [
      ...baseRoutes,
      ...filteredRoutes,
      '', // Separator doesn't have a route
      '/admin-profile',
    ];
  }
  
  return [
    '/dashboard', // User dashboard
    '/my-requests', // My Requests
    '/my-issues', // My Issues
    '', // Separator
    '/profile',
  ];
};

// Function to get filtered navigation items
export function getFilteredNavigationItems(isAdmin: boolean, enabledModules?: EnabledModules): NavigationItem[] {
  return navigationItems.filter(item => {
    // Include items that match admin status
    if (item.adminOnly && !isAdmin) return false;
    if (!item.adminOnly && isAdmin) return false;
    
    // For admin items, check module preferences
    if (isAdmin && item.moduleKey && enabledModules) {
      return enabledModules[item.moduleKey];
    }
    
    return true;
  });
}
