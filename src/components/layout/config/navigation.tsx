
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

// Export navigation for the Layout component
export const adminNavigation: NavigationTab[] = navigationItems
  .filter(item => item.adminOnly !== false)
  .map(item => ({
    label: item.title,
    value: item.href,
    icon: item.icon?.type || Command,
  }));

export const userNavigation: NavigationTab[] = navigationItems
  .filter(item => !item.adminOnly)
  .map(item => ({
    label: item.title,
    value: item.href,
    icon: item.icon?.type || Command,
  }));

export const getNavigationRoutes = (isAdmin: boolean): string[] => {
  const items = isAdmin 
    ? navigationItems.filter(item => item.adminOnly !== false)
    : navigationItems.filter(item => !item.adminOnly);
  
  return items.map(item => item.href);
};
