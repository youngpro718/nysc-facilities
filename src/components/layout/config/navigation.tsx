
import {
  Building,
  Command,
  Lightbulb,
  Mail,
  User,
  Tag,
  Map,
  KeyRound,
  Repeat,
  Calendar
} from 'lucide-react';
import { NavigationItem, NavigationTab } from '../types';

export type { NavigationItem };

// Define the navigation items for admin and user interfaces
export const navigationItems: NavigationItem[] = [
  {
    title: 'Dashboard',
    href: '/',
    icon: <Command size={18} />,
    adminOnly: true,
  },
  {
    title: 'User Dashboard',
    href: '/dashboard',
    icon: <Command size={18} />,
    adminOnly: false,
  },
  {
    title: 'Spaces',
    href: '/spaces',
    icon: <Map size={18} />,
    adminOnly: true,
  },
  {
    title: 'Issues',
    href: '/issues',
    icon: <Mail size={18} />,
    adminOnly: true,
  },
  {
    title: 'Occupants',
    href: '/occupants',
    icon: <User size={18} />,
    adminOnly: true,
  },
  {
    title: 'Keys',
    href: '/keys',
    icon: <KeyRound size={18} />,
    adminOnly: true,
  },
  {
    title: 'Lighting',
    href: '/lighting',
    icon: <Lightbulb size={18} />,
    adminOnly: true,
  },
  {
    title: 'Relocations',
    href: '/relocations',
    icon: <Repeat size={18} />,
    adminOnly: true,
  },
  {
    title: 'Court Terms',
    href: '/terms',
    icon: <Calendar size={18} />,
    adminOnly: true,
  },
];

export const userNavigationItems: NavigationItem[] = [
  {
    title: 'Profile',
    href: '/profile',
    icon: <User size={18} />,
    adminOnly: false,
  },
  {
    title: 'Admin Profile',
    href: '/admin-profile',
    icon: <Building size={18} />,
    adminOnly: true,
  },
];

// Create the admin and user navigation arrays for the sidebar
export const adminNavigation: NavigationTab[] = [
  { title: 'Dashboard', icon: Command },
  { title: 'Spaces', icon: Map },
  { title: 'Issues', icon: Mail },
  { title: 'Occupants', icon: User },
  { title: 'Keys', icon: KeyRound },
  { title: 'Lighting', icon: Lightbulb },
  { title: 'Relocations', icon: Repeat },
  { title: 'Court Terms', icon: Calendar },
  { type: 'separator' },
  { title: 'Profile', icon: User },
];

export const userNavigation: NavigationTab[] = [
  { title: 'Dashboard', icon: Command },
  { type: 'separator' },
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
      '/relocations',
      '/terms',
      '', // Separator doesn't have a route
      '/admin-profile',
    ];
  }
  
  return [
    '/dashboard', // User dashboard
    '', // Separator
    '/profile',
  ];
};
