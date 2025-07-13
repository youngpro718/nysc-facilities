
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
} from 'lucide-react';
import { NavigationTab, NavigationItem } from '../types';

// Define the navigation items for admin and user interfaces
export const navigationItems: NavigationItem[] = [
  {
    title: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    adminOnly: true,
  },
  {
    title: 'User Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    adminOnly: false,
  },
  {
    title: 'Spaces',
    href: '/spaces',
    icon: Building2,
    adminOnly: true,
  },
  {
    title: 'Issues',
    href: '/issues',
    icon: AlertTriangle,
    adminOnly: true,
  },
  {
    title: 'Occupants',
    href: '/occupants',
    icon: Users,
    adminOnly: true,
  },
  {
    title: 'Keys',
    href: '/keys',
    icon: KeyRound,
    adminOnly: true,
  },
  {
    title: 'Lighting',
    href: '/lighting',
    icon: Zap,
    adminOnly: true,
  },
  {
    title: 'Maintenance',
    href: '/maintenance',
    icon: Wrench,
    adminOnly: true,
  },
  {
    title: 'Court Operations',
    href: '/court-operations',
    icon: Gavel,
    adminOnly: true,
  },
  {
    title: 'Inventory',
    href: '/inventory',
    icon: Package,
    adminOnly: true,
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

// Create the admin and user navigation arrays for the sidebar
export const adminNavigation: NavigationTab[] = [
  { title: 'Dashboard', icon: LayoutDashboard },
  { title: 'Spaces', icon: Building2 },
  { title: 'Issues', icon: AlertTriangle },
  { title: 'Occupants', icon: Users },
  { title: 'Keys', icon: KeyRound },
  { title: 'Lighting', icon: Zap },
  { title: 'Maintenance', icon: Wrench },
  { title: 'Court Operations', icon: Gavel },
  { title: 'Inventory', icon: Package },
  { type: "separator" },
  { title: 'Admin Profile', icon: UserCog },
];

export const userNavigation: NavigationTab[] = [
  { title: 'Dashboard', icon: LayoutDashboard },
  { title: 'My Requests', icon: FileText },
  { title: 'My Issues', icon: MessageSquare },
  { type: "separator" },
  { title: 'Profile', icon: User },
];

// Helper function to get navigation routes based on admin status
export const getNavigationRoutes = (isAdmin: boolean): string[] => {
  if (isAdmin) {
    return [
      '/', // Dashboard
      '/spaces',
      '/issues',
      '/occupants',
      '/keys',
      '/lighting',
      '/maintenance',
      '/court-operations',
      '/inventory',
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
