
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
import { RolePermissions, CourtRole } from '@/hooks/useRolePermissions';

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

// Create filtered navigation based on role permissions
export function getRoleBasedNavigation(permissions: RolePermissions, userRole: CourtRole): NavigationTab[] {
  const baseNavigation: NavigationTab[] = [
    { title: 'Dashboard', icon: LayoutDashboard }, // Always visible
  ];

  const featureNavigation: Array<NavigationTab & { feature: keyof RolePermissions }> = [
    { title: 'Spaces', icon: Building2, feature: 'spaces' },
    { title: 'Issues', icon: AlertTriangle, feature: 'issues' },
    { title: 'Occupants', icon: Users, feature: 'occupants' },
    { title: 'Inventory', icon: Boxes, feature: 'inventory' },
    { title: 'Supply Requests', icon: Package, feature: 'supply_requests' },
    { title: 'Keys', icon: KeyRound, feature: 'keys' },
    { title: 'Lighting', icon: Zap, feature: 'lighting' },
    { title: 'Maintenance', icon: Wrench, feature: 'maintenance' },
    { title: 'Court Operations', icon: Gavel, feature: 'court_operations' },
  ];

  // Filter based on role permissions (show if user has at least read access)
  const filteredFeatures = featureNavigation.filter(nav => 
    permissions[nav.feature] !== null
  );

  const profileTitle = userRole === 'admin' ? 'Admin Profile' : 'Profile';

  return [
    ...baseNavigation,
    ...filteredFeatures,
    { type: "separator" },
    { title: profileTitle, icon: userRole === 'admin' ? UserCog : User },
  ];
}

// Legacy function for backwards compatibility
export function getAdminNavigation(): NavigationTab[] {
  return [
    { title: 'Dashboard', icon: LayoutDashboard },
    { title: 'Spaces', icon: Building2 },
    { title: 'Issues', icon: AlertTriangle },
    { title: 'Occupants', icon: Users },
    { title: 'Inventory', icon: Boxes },
    { title: 'Supply Requests', icon: Package },
    { title: 'Keys', icon: KeyRound },
    { title: 'Lighting', icon: Zap },
    { title: 'Maintenance', icon: Wrench },
    { title: 'Court Operations', icon: Gavel },
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

// Helper function to get navigation routes based on role permissions
export const getNavigationRoutes = (permissions: RolePermissions, userRole: CourtRole): string[] => {
  const baseRoutes = ['/']; // Dashboard always available
  
  const featureRoutes: Array<{ route: string; feature: keyof RolePermissions }> = [
    { route: '/spaces', feature: 'spaces' },
    { route: '/issues', feature: 'issues' },
    { route: '/occupants', feature: 'occupants' },
    { route: '/inventory', feature: 'inventory' },
    { route: '/admin/supply-requests', feature: 'supply_requests' },
    { route: '/keys', feature: 'keys' },
    { route: '/lighting', feature: 'lighting' },
    { route: '/maintenance', feature: 'maintenance' },
    { route: '/court-operations', feature: 'court_operations' },
  ];

  // Filter routes based on role permissions (show if user has at least read access)
  const filteredRoutes = featureRoutes
    .filter(route => permissions[route.feature] !== null)
    .map(route => route.route);

  const profileRoute = userRole === 'admin' ? '/admin-profile' : '/profile';

  return [
    ...baseRoutes,
    ...filteredRoutes,
    '', // Separator doesn't have a route
    profileRoute,
  ];
};

// Function to get filtered navigation items based on role permissions
export function getFilteredNavigationItems(permissions: RolePermissions, userRole: CourtRole): NavigationItem[] {
  return navigationItems.filter(item => {
    // Always show dashboard
    if (item.href === '/' || item.href === '/dashboard') return true;
    
    // Check role permissions for feature-based items
    if (item.moduleKey && item.moduleKey in permissions) {
      return permissions[item.moduleKey as keyof RolePermissions] !== null;
    }
    
    // For non-module items, use existing admin logic
    if (item.adminOnly && userRole !== 'admin') return false;
    
    return true;
  });
}
