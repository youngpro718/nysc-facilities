import { 
  LayoutDashboard, 
  Building2, 
  AlertTriangle, 
  Users, 
  KeyRound, 
  Package, 
  Package2,
  Zap,
  Gavel,
  FileText,
  MessageSquare,
  User,
  UserCog,
  Settings,
  Warehouse,
  LucideIcon
} from 'lucide-react';

export interface RouteConfig {
  path: string;
  title: string;
  breadcrumbLabel: string;
  icon?: LucideIcon;
  parent?: string;
  hideFromBreadcrumb?: boolean;
}

/**
 * Centralized route configuration for navigation and breadcrumbs
 */
export const routes: Record<string, RouteConfig> = {
  // Dashboard routes
  '/': {
    path: '/',
    title: 'Admin Dashboard',
    breadcrumbLabel: 'Dashboard',
    icon: LayoutDashboard,
  },
  '/dashboard': {
    path: '/dashboard',
    title: 'Dashboard',
    breadcrumbLabel: 'Dashboard',
    icon: LayoutDashboard,
  },
  '/court-aide-dashboard': {
    path: '/court-aide-dashboard',
    title: 'Supply Staff Dashboard',
    breadcrumbLabel: 'Dashboard',
    icon: LayoutDashboard,
  },
  '/cmc-dashboard': {
    path: '/cmc-dashboard',
    title: 'CMC Dashboard',
    breadcrumbLabel: 'Dashboard',
    icon: LayoutDashboard,
  },
  
  // User request pages
  '/my-activity': {
    path: '/my-activity',
    title: 'My Activity',
    breadcrumbLabel: 'My Activity',
    icon: FileText,
    parent: '/dashboard',
  },
  '/my-requests': {
    path: '/my-requests',
    title: 'My Key Requests',
    breadcrumbLabel: 'Key Requests',
    icon: FileText,
    parent: '/my-activity',
  },
  '/my-supply-requests': {
    path: '/my-supply-requests',
    title: 'My Supply Requests',
    breadcrumbLabel: 'Supply Requests',
    icon: Package,
    parent: '/my-activity',
  },
  '/my-issues': {
    path: '/my-issues',
    title: 'My Issues',
    breadcrumbLabel: 'Issues',
    icon: MessageSquare,
    parent: '/my-activity',
  },
  
  // Admin pages
  '/admin/key-requests': {
    path: '/admin/key-requests',
    title: 'Key Requests Management',
    breadcrumbLabel: 'Key Requests',
    icon: KeyRound,
    parent: '/',
  },
  '/admin/supply-requests': {
    path: '/admin/supply-requests',
    title: 'Supply Requests Management',
    breadcrumbLabel: 'Supply Requests',
    icon: Package,
    parent: '/',
  },
  
  // Supply & Inventory
  '/supply-room': {
    path: '/supply-room',
    title: 'Supply Room',
    breadcrumbLabel: 'Supply Room',
    icon: Warehouse,
    parent: '/dashboard',
  },
  '/inventory': {
    path: '/inventory',
    title: 'Inventory Management',
    breadcrumbLabel: 'Inventory',
    icon: Package2,
    parent: '/dashboard',
  },
  '/tasks': {
    path: '/tasks',
    title: 'Task Management',
    breadcrumbLabel: 'Tasks',
    icon: Package,
    parent: '/',
  },
  
  // Operations
  '/operations': {
    path: '/operations',
    title: 'Operations Center',
    breadcrumbLabel: 'Operations',
    icon: AlertTriangle,
    parent: '/',
  },
  '/spaces': {
    path: '/spaces',
    title: 'Space Management',
    breadcrumbLabel: 'Spaces',
    icon: Building2,
    parent: '/',
  },
  '/occupants': {
    path: '/occupants',
    title: 'Occupant Management',
    breadcrumbLabel: 'Occupants',
    icon: Users,
    parent: '/',
  },
  '/keys': {
    path: '/keys',
    title: 'Key Management',
    breadcrumbLabel: 'Keys',
    icon: KeyRound,
    parent: '/',
  },
  '/lighting': {
    path: '/lighting',
    title: 'Lighting Management',
    breadcrumbLabel: 'Lighting',
    icon: Zap,
    parent: '/',
  },
  '/court-operations': {
    path: '/court-operations',
    title: 'Court Operations',
    breadcrumbLabel: 'Court Operations',
    icon: Gavel,
    parent: '/',
  },
  
  // Profile & Settings
  '/profile': {
    path: '/profile',
    title: 'My Profile',
    breadcrumbLabel: 'Profile',
    icon: User,
  },
  '/admin-profile': {
    path: '/admin-profile',
    title: 'Admin Profile',
    breadcrumbLabel: 'Admin Profile',
    icon: UserCog,
    parent: '/',
  },
  '/system-settings': {
    path: '/system-settings',
    title: 'System Settings',
    breadcrumbLabel: 'Settings',
    icon: Settings,
    parent: '/',
  },
  
  // Public pages
  '/term-sheet': {
    path: '/term-sheet',
    title: 'Criminal Term Sheet',
    breadcrumbLabel: 'Term Sheet',
    icon: FileText,
    parent: '/dashboard',
  },
};

/**
 * Get breadcrumb trail for a given path
 */
export function getBreadcrumbTrail(path: string): RouteConfig[] {
  const trail: RouteConfig[] = [];
  let currentPath = path;
  
  // Build trail by following parent links
  while (currentPath) {
    const route = routes[currentPath];
    if (route && !route.hideFromBreadcrumb) {
      trail.unshift(route);
    }
    currentPath = route?.parent || '';
  }
  
  return trail;
}

/**
 * Get route config for a path
 */
export function getRouteConfig(path: string): RouteConfig | undefined {
  return routes[path];
}
