import {
  Settings,
  LayoutDashboard,
  Building2,
  AlertTriangle,
  Users,
  Boxes,
  KeyRound,
  Zap,
  Wrench,
  Gavel,
  UserCog,
  GitFork,
  DoorClosed,
  Package,
  BarChart3,
  UserCheck,
  User,
  FileText,
  MessageSquare,
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
    title: 'Operations',
    href: '/operations',
    icon: AlertTriangle,
    adminOnly: true,
    moduleKey: 'operations',
  },
];

// Secondary navigation items (for submenu/more section)
export const secondaryNavigationItems: NavigationItem[] = [
  {
    title: 'People',
    href: '/people',
    icon: Users,
    adminOnly: true,
    moduleKey: 'occupants',
    children: [
      {
        title: 'Occupants',
        href: '/occupants',
        icon: Users,
        adminOnly: true,
        moduleKey: 'occupants',
      },
      {
        title: 'Room Assignments',
        href: '/room-assignments',
        icon: UserCheck,
        adminOnly: true,
        moduleKey: 'occupants',
      },
    ],
  },
  {
    title: 'Assets',
    href: '/assets',
    icon: Package,
    adminOnly: true,
    moduleKey: 'inventory',
    children: [
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
        title: 'Lighting',
        href: '/lighting',
        icon: Zap,
        adminOnly: true,
        moduleKey: 'lighting',
      },
    ],
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
  {
    title: 'System Settings',
    href: '/system-settings',
    icon: Settings,
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
    { title: 'Operations', icon: AlertTriangle, feature: 'operations' },
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
    { title: 'Operations', icon: AlertTriangle },
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
    { route: '/operations', feature: 'operations' },
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
