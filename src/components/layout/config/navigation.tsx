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
  Package2,
  BarChart3,
  UserCheck,
  User,
  FileText,
  MessageSquare,
  Upload,
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
    adminOnly: false, // Allow CMC and facility staff
    moduleKey: 'operations',
  },
];

// Secondary navigation items (for submenu/more section)
export const secondaryNavigationItems: NavigationItem[] = [
  {
    title: 'Term Sheet',
    href: '/term-sheet',
    icon: FileText,
    adminOnly: false,
    moduleKey: undefined,
  },
  {
    title: 'Form Templates',
    href: '/form-templates',
    icon: FileText,
    adminOnly: false,
    moduleKey: undefined,
  },
  {
    title: 'Form Intake',
    href: '/form-intake',
    icon: Upload,
    adminOnly: false,
    moduleKey: undefined,
  },
  {
    title: 'Routing Rules',
    href: '/admin/routing-rules',
    icon: GitFork,
    adminOnly: true,
    moduleKey: undefined,
  },
  {
    title: 'Access & Assignments',
    href: '/access-assignments',
    icon: UserCheck,
    adminOnly: true,
    moduleKey: 'occupants',
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
        adminOnly: false,
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
  {
    title: 'Form Templates',
    href: '/form-templates',
    icon: FileText,
    adminOnly: false,
  },
  {
    title: 'Form Intake',
    href: '/form-intake',
    icon: Upload,
    adminOnly: false,
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
export function getRoleBasedNavigation(permissions: RolePermissions, userRole: CourtRole, profile?: any): NavigationTab[] {
  console.log('Navigation - userRole:', userRole, 'profile department:', profile?.departments?.name || profile?.department);
  console.log('Navigation - profile title:', profile?.title);
  
  // Admin navigation
  if (userRole === 'admin') {
    return [
      { title: 'Dashboard', icon: LayoutDashboard },
      { title: 'Spaces', icon: Building2 },
      { title: 'Issues', icon: AlertTriangle },
      { title: 'Access & Assignments', icon: UserCheck },
      { title: 'Keys', icon: KeyRound },
      { title: 'Inventory', icon: Package2 },
      { title: 'Lighting', icon: Zap },
      { title: 'Court Operations', icon: Gavel },
      { type: "separator" },
      { title: 'Admin Profile', icon: UserCog },
    ];
  }
  
  // Facilities Manager navigation (similar to admin but slightly restricted)
  if (userRole === 'facilities_manager') {
    return [
      { title: 'Dashboard', icon: LayoutDashboard },
      { title: 'Spaces', icon: Building2 },
      { title: 'Issues', icon: AlertTriangle },
      { title: 'Access & Assignments', icon: UserCheck },
      { title: 'Keys', icon: KeyRound },
      { title: 'Inventory', icon: Package2 },
      { title: 'Lighting', icon: Zap },
      { type: "separator" },
      { title: 'Profile', icon: User },
    ];
  }
  
  // CMC (Court Management Coordinator) navigation
  if (userRole === 'cmc') {
    return [
      { title: 'Dashboard', icon: LayoutDashboard },
      { title: 'Court Operations', icon: Gavel },
      { title: 'My Activity', icon: FileText },
      { type: "separator" },
      { title: 'Profile', icon: User },
    ];
  }
  
  // Court Aide (Supply Staff) navigation
  if (userRole === 'court_aide') {
    return [
      { title: 'Dashboard', icon: LayoutDashboard },
      { title: 'Supplies', icon: Package },
      { type: "separator" },
      { title: 'Profile', icon: User },
    ];
  }
  
  // Purchasing Staff navigation
  if (userRole === 'purchasing_staff') {
    return [
      { title: 'Dashboard', icon: LayoutDashboard },
      { title: 'Supplies', icon: Package },
      { type: "separator" },
      { title: 'Profile', icon: User },
    ];
  }
  
  // Standard user navigation
  return [
    { title: 'Dashboard', icon: LayoutDashboard },
    { title: 'My Activity', icon: FileText },
    { type: "separator" },
    { title: 'Profile', icon: User },
  ];
}

// Legacy function for backwards compatibility
export function getAdminNavigation(): NavigationTab[] {
  return [
    { title: 'Dashboard', icon: LayoutDashboard },
    { title: 'Spaces', icon: Building2 },
    { title: 'Issues Management', icon: AlertTriangle },
    { type: "separator" },
    { title: 'Admin Profile', icon: UserCog },
  ];
}

// Legacy export for backwards compatibility
export const adminNavigation: NavigationTab[] = getAdminNavigation();

export const userNavigation: NavigationTab[] = [
  { title: 'Dashboard', icon: LayoutDashboard },
  { title: 'My Activity', icon: FileText },
  { type: "separator" },
  { title: 'Profile', icon: User },
];

// Helper function to get navigation routes based on role permissions
export const getNavigationRoutes = (permissions: RolePermissions, userRole: CourtRole, profile?: any): string[] => {
  console.log('Routes - userRole:', userRole, 'profile department:', profile?.departments?.name || profile?.department);
  console.log('Routes - profile title:', profile?.title);
  
  // Admin routes
  if (userRole === 'admin') {
    return [
      '/', // Admin Dashboard
      '/spaces',
      '/operations', // Contains Issues, Maintenance, Supply Requests
      '/access-assignments',
      '/keys',
      '/inventory',
      '/lighting',
      '/court-operations',
      '/admin-profile',
    ];
  }
  
  // Facilities Manager routes (similar to admin)
  if (userRole === 'facilities_manager') {
    return [
      '/', // Facilities Dashboard
      '/spaces',
      '/operations',
      '/access-assignments',
      '/keys',
      '/inventory',
      '/lighting',
      '', // Separator
      '/profile',
    ];
  }
  
  // CMC (Court Management Coordinator) routes
  if (userRole === 'cmc') {
    return [
      '/cmc-dashboard',
      '/court-operations',
      '/my-activity',
      '', // Separator
      '/profile',
    ];
  }
  
  // Court Aide (Supply Staff) routes
  if (userRole === 'court_aide') {
    return [
      '/court-aide-dashboard',
      '/supplies',
      '', // Separator
      '/profile',
    ];
  }
  
  // Purchasing Staff routes
  if (userRole === 'purchasing_staff') {
    return [
      '/purchasing-dashboard',
      '/supplies',
      '', // Separator
      '/profile',
    ];
  }
  
  // Standard user routes
  return [
    '/dashboard', // User Dashboard
    '/my-activity',
    '', // Separator
    '/profile',
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
