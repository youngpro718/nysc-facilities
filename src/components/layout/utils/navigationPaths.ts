/**
 * Centralized navigation path mapping.
 * Used by BottomTabBar, DesktopNavigationImproved, and MobileMenu.
 */

const BASE_PATH_MAP: Record<string, string> = {
  'Spaces': '/spaces',
  'New Request': '/request',
  'Operations': '/operations',
  'Building Issues': '/operations',
  'Issues': '/operations?tab=issues',
  'Access & Assignments': '/access-assignments',
  'Occupants': '/occupants',
  'Inventory': '/inventory',
  'Tasks': '/tasks',
  'Supplies': '/tasks',
  'Supply Room': '/supply-room',
  'Keys': '/keys',
  'Maintenance': '/operations?tab=maintenance',
  'Court Operations': '/court-operations',
  'My Activity': '/my-activity',
  'My Requests': '/my-activity?tab=keys',
  'My Issues': '/my-activity?tab=reported',
  'Admin Center': '/admin',
  'Admin Profile': '/admin',
  'Profile': '/profile',
  'System Settings': '/system-settings',
  'Term Sheet': '/term-sheet',
  'Notifications': '/notifications',
};

export function getNavigationPath(title: string, isAdmin?: boolean): string {
  // Role-dependent paths
  if (title === 'Dashboard') return isAdmin ? '/' : '/dashboard';
  if (title === 'Supply Requests') return isAdmin ? '/admin/supply-requests' : '/my-supply-requests';

  return BASE_PATH_MAP[title] || '/';
}

export function getNavigationDescription(title: string): string {
  const descriptionMap: Record<string, string> = {
    'Dashboard': 'Overview & stats',
    'New Request': 'Supplies, help, issues, keys',
    'Spaces': 'Manage buildings',
    'Operations': 'Issues, Maintenance, Supplies',
    'Building Issues': 'Track & resolve building issues',
    'Issues': 'Track problems',
    'Access & Assignments': 'Access levels & assignments',
    'Occupants': 'Manage people',
    'Inventory': 'Stock & assets',
    'Tasks': 'Staff task management',
    'Supplies': 'Staff task management',
    'Supply Requests': 'Request and track supplies',
    'Supply Room': 'Supply room management',
    'Keys': 'Key management',
    'Maintenance': 'Schedule & track maintenance',
    'Court Operations': 'Manage court schedules',
    'My Requests': 'View your submitted requests',
    'My Issues': 'Track your reported issues',
    'My Activity': 'Track all your requests',
    'Admin Center': 'Team & user management',
    'Admin Profile': 'Team & user management',
    'Profile': 'Your account',
    'System Settings': 'System configuration',
    'Term Sheet': 'Court term assignments',
    'Notifications': 'Your notifications',
  };
  return descriptionMap[title] || '';
}
