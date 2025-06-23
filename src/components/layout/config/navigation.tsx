
import {
  Building,
  Command,
  Lightbulb,
  Mail,
  User,
  Map,
  KeyRound,
  Repeat,
  Calendar,
} from 'lucide-react';
import { NavigationTab, NavigationItem } from '../types';

// Define the navigation items for admin and user interfaces
export const navigationItems: NavigationItem[] = [
  {
    title: 'Dashboard',
    href: '/',
    icon: Command,
    adminOnly: true,
  },
  {
    title: 'User Dashboard',
    href: '/dashboard',
    icon: Command,
    adminOnly: false,
  },
  {
    title: 'Spaces',
    href: '/spaces',
    icon: Map,
    adminOnly: true,
  },
  {
    title: 'Issues',
    href: '/issues',
    icon: Mail,
    adminOnly: true,
  },
  {
    title: 'Occupants',
    href: '/occupants',
    icon: User,
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
    icon: Lightbulb,
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
    icon: Building,
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


  { type: "separator" },
  { title: 'Profile', icon: User },
];

export const userNavigation: NavigationTab[] = [
  { title: 'Dashboard', icon: Command },
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
