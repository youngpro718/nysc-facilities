/**
 * Centralized navigation path mapping.
 * Used by BottomTabBar, DesktopNavigationImproved, and MobileMenu.
 */

const BASE_PATH_MAP: Record<string, string> = {
  // 'Spaces' is the section that contains rooms.
  'Spaces': '/spaces',
  'Rooms': '/spaces', // legacy label, kept as alias
  'New Request': '/request',
  // Issues / Maintenance / Lighting are first-class siblings.
  // Each resolves to the Operations page with the correct tab pre-selected.
  'Issues': '/issues',
  'Maintenance': '/maintenance',
  'Lighting': '/lighting',
  // Legacy aliases for the old consolidated "Operations" entry.
  'Operations': '/issues',
  'Building Issues': '/issues',
  'Personnel': '/occupants',
  'Occupants': '/occupants', // legacy label, kept as alias
  'Inventory': '/inventory',
  'Tasks': '/tasks',
  'Supplies': '/tasks',
  'Supply Room': '/supply-room',
  'Keys': '/keys',
  'Term Sheet': '/term-sheet',
  'Court Operations': '/term-sheet',
  'My Activity': '/my-activity',
  'My Requests': '/my-activity?tab=keys',
  'My Issues': '/my-activity?tab=reported',
  'Admin Center': '/admin',
  'Admin Profile': '/admin',
  'Profile': '/profile',
  'Work Center': '/work-center',
  'System Settings': '/system-settings',
  'Notifications': '/notifications',
};

export function getNavigationPath(title: string, isAdmin?: boolean, userRole?: string | null): string {
  // Role-dependent paths
  if (title === 'Dashboard') {
    if (userRole === 'purchasing') return '/inventory';
    if (userRole === 'court_aide') return '/work-center';
    if (userRole === 'court_officer') return '/keys';
    if (userRole === 'court_liaison') return '/term-sheet';
    return isAdmin ? '/' : '/dashboard';
  }
  if (title === 'Supply Requests') return isAdmin ? '/admin/supply-requests' : '/my-supply-requests';

  return BASE_PATH_MAP[title] || '/';
}

/* Nav routes that redirect into the Operations page, keyed by ?tab value. */
const OPERATIONS_TAB_ROUTES: Record<string, string> = {
  issues: '/issues',
  maintenance: '/maintenance',
  lighting: '/lighting',
};

/**
 * Whether a nav item's route should render as active for the current location.
 *
 * Handles two cases plain `pathname.startsWith(route)` gets wrong:
 * - Issues/Maintenance/Lighting redirect to /operations?tab=…, so the pathname
 *   never stays on the nav route itself. The active tab decides the item.
 *   (No tab / the overview tab counts as Issues, the section's entry point.)
 * - Routes that pin a tab (e.g. /my-activity?tab=keys) only match when the
 *   current URL has that tab, so sibling items don't all light up at once.
 */
export function isNavRouteActive(route: string, pathname: string, search: string): boolean {
  if (!route) return false;
  if (route === '/') return pathname === '/';

  const [base, routeQuery] = route.split('?');

  if (pathname === '/operations' || pathname.startsWith('/operations/')) {
    const tab = new URLSearchParams(search).get('tab') ?? 'issues';
    const owner = OPERATIONS_TAB_ROUTES[tab] ?? '/issues';
    return base === owner || base === '/operations';
  }

  if (!(pathname === base || pathname.startsWith(`${base}/`))) return false;

  if (routeQuery) {
    const wantedTab = new URLSearchParams(routeQuery).get('tab');
    if (wantedTab) return new URLSearchParams(search).get('tab') === wantedTab;
  }
  return true;
}

export function getNavigationDescription(title: string): string {
  const descriptionMap: Record<string, string> = {
    'Dashboard': 'Overview & stats',
    'New Request': 'Supplies, help, issues, keys',
    'Spaces': 'Buildings, floors, and rooms',
    'Rooms': 'Buildings, floors, and rooms',
    'Operations': 'Issues, maintenance, lighting',
    'Building Issues': 'Track & resolve building issues',
    'Issues': 'Report and track issues',
    'Lighting': 'Lighting fixtures and outages',
    'Access & Assignments': 'Access levels & assignments',
    'Personnel': 'Manage personnel',
    'Occupants': 'Manage personnel',
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
