import { 
  LayoutDashboard, 
  Building2, 
  AlertTriangle, 
  KeyRound, 
  Package, 
  Package2,
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
  '/work-center': {
    path: '/work-center',
    title: 'Work Center',
    breadcrumbLabel: 'Work Center',
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
    title: 'My Requests',
    breadcrumbLabel: 'My Requests',
    icon: FileText,
    parent: '/dashboard',
  },
  '/supplies': {
    path: '/supplies',
    title: 'Supplies & Requests',
    breadcrumbLabel: 'Supplies',
    icon: Package,
    parent: '/dashboard',
  },
  '/my-supply-requests': {
    path: '/my-supply-requests',
    title: 'My Supply Requests',
    breadcrumbLabel: 'Supply Requests',
    icon: Package,
    parent: '/my-requests',
  },
  '/my-issues': {
    path: '/my-issues',
    title: 'My Issues',
    breadcrumbLabel: 'Issues',
    icon: MessageSquare,
    parent: '/my-activity',
  },
  
  // Admin pages
  '/admin/supply-requests': {
    path: '/admin/supply-requests',
    title: 'Supply Requests',
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
    title: 'Inventory',
    breadcrumbLabel: 'Inventory',
    icon: Package2,
    parent: '/dashboard',
  },
  '/tasks': {
    path: '/tasks',
    title: 'Tasks',
    breadcrumbLabel: 'Tasks',
    icon: Package,
    parent: '/',
  },
  
  // Operations
  '/operations': {
    path: '/operations',
    title: 'Operations',
    breadcrumbLabel: 'Operations',
    icon: AlertTriangle,
    parent: '/',
  },
  '/issues': {
    path: '/issues',
    title: 'Issues',
    breadcrumbLabel: 'Issues',
    icon: AlertTriangle,
    parent: '/',
  },
  '/maintenance': {
    path: '/maintenance',
    title: 'Maintenance',
    breadcrumbLabel: 'Maintenance',
    icon: Package,
    parent: '/',
  },
  '/lighting': {
    path: '/lighting',
    title: 'Lighting',
    breadcrumbLabel: 'Lighting',
    icon: AlertTriangle,
    parent: '/',
  },
  '/spaces': {
    path: '/spaces',
    title: 'Spaces',
    breadcrumbLabel: 'Spaces',
    icon: Building2,
    parent: '/',
  },
  '/keys': {
    path: '/keys',
    title: 'Keys',
    breadcrumbLabel: 'Keys',
    icon: KeyRound,
    parent: '/',
  },
  '/keys/request': {
    path: '/keys/request',
    title: 'Request a Key',
    breadcrumbLabel: 'Request a Key',
    icon: KeyRound,
    parent: '/keys',
  },
  '/keys/kiosk': {
    path: '/keys/kiosk',
    title: 'Keys Kiosk',
    breadcrumbLabel: 'Kiosk',
    icon: KeyRound,
    parent: '/keys',
  },
  '/lighting/report': {
    path: '/lighting/report',
    title: 'Report Lighting',
    breadcrumbLabel: 'Report Lighting',
    icon: AlertTriangle,
    parent: '/operations',
  },
  '/notifications': {
    path: '/notifications',
    title: 'Notifications',
    breadcrumbLabel: 'Notifications',
    icon: MessageSquare,
  },
  
  // Profile & Settings
  '/profile': {
    path: '/profile',
    title: 'Profile',
    breadcrumbLabel: 'Profile',
    icon: User,
  },
  '/admin': {
    path: '/admin',
    title: 'Admin Center',
    breadcrumbLabel: 'Admin Center',
    icon: UserCog,
    parent: '/',
  },
  '/admin/routing-rules': {
    path: '/admin/routing-rules',
    title: 'Form Routing Rules',
    breadcrumbLabel: 'Routing Rules',
    icon: Settings,
    parent: '/admin',
  },
  '/admin/form-templates': {
    path: '/admin/form-templates',
    title: 'Form Builder',
    breadcrumbLabel: 'Form Builder',
    icon: FileText,
    parent: '/admin',
  },
  '/system-settings': {
    path: '/system-settings',
    title: 'System Settings',
    breadcrumbLabel: 'Settings',
    icon: Settings,
    parent: '/',
  },
  
  // Help
  '/help': {
    path: '/help',
    title: 'Help Center',
    breadcrumbLabel: 'Help',
    icon: FileText,
  },
  
  // Public pages
  '/occupants': {
    path: '/occupants',
    title: 'Personnel',
    breadcrumbLabel: 'Personnel',
    icon: UserCog,
    parent: '/',
  },
  '/term-sheet': {
    path: '/term-sheet',
    title: 'Court Operations',
    breadcrumbLabel: 'Court Operations',
    icon: FileText,
    parent: '/dashboard',
  },
  '/courtrooms': {
    path: '/courtrooms',
    title: 'Courtrooms',
    breadcrumbLabel: 'Courtrooms',
    icon: Building2,
    parent: '/term-sheet',
  },
  '/command-center': {
    path: '/command-center',
    title: 'Command Center',
    breadcrumbLabel: 'Command Center',
    icon: LayoutDashboard,
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
