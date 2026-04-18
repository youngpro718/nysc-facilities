import { Step } from 'react-joyride';

/**
 * Tour step definitions for each page/module.
 * Targets use CSS selectors — data-tour attributes are added to key UI elements.
 * Falls back to body if the target element isn't found.
 */

export const adminDashboardTour: Step[] = [
  {
    target: 'body',
    content: '👋 Welcome to the Admin Dashboard! This is your command center for managing the entire NYSC facility. This tour will show you the key features and how to navigate efficiently.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="nav-bar"]',
    content: '📍 Navigation Sidebar: Click any icon to access different modules. Your available modules are based on your admin role. The sidebar collapses on smaller screens to save space.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="notification-box"]',
    content: '🔔 Notifications: Real-time alerts appear here. A red badge shows unread count. Click to see pending approvals, critical issues, and system updates.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="theme-toggle"]',
    content: '🌓 Theme Toggle: Switch between light and dark mode. Your preference is saved automatically and syncs across devices.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="user-avatar"]',
    content: '👤 Profile Menu: Access your profile settings, view your role, and sign out. You can update your contact info and notification preferences here.',
    placement: 'bottom',
    disableBeacon: true,
  },
];

export const spacesMgmtTour: Step[] = [
  {
    target: 'body',
    content: 'Rooms Management lets you manage the physical hierarchy: Buildings → Floors → Rooms & Hallways. Let\'s explore.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="building-selector"]',
    content: 'Start by selecting a building. All floors and rooms will filter to that building.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="floor-selector"]',
    content: 'Then pick a floor to see its rooms and hallways.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="space-list"]',
    content: 'Here you\'ll see all rooms on the selected floor. Click any room card to view details, edit, or manage assignments.',
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '[data-tour="add-space-btn"]',
    content: 'Click the "+" button to create a new room, hallway, or door. Fill in the details and save.',
    placement: 'left',
    disableBeacon: true,
  },
];

export const operationsTour: Step[] = [
  {
    target: 'body',
    content: 'The Operations Center is your hub for facility issues, maintenance, and supply request oversight.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="ops-tabs"]',
    content: 'Use these tabs to switch between Issues, Maintenance, and Supply Requests views.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="ops-filters"]',
    content: 'Filter by building, status, priority, or search by keyword to find specific items quickly.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="ops-issue-card"]',
    content: 'Each card shows an issue summary. Click to open details where you can change status, priority, add notes, and assign it.',
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '[data-tour="ops-report-btn"]',
    content: 'Click "Report Issue" to create a new facility issue. Select the type, location, and priority.',
    placement: 'left',
    disableBeacon: true,
  },
];

export const courtOpsTour: Step[] = [
  {
    target: 'body',
    content: 'Court Operations manages courtroom sessions, term assignments, personnel, and shutdowns.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="court-status-dashboard"]',
    content: 'Today\'s Status shows a live overview of all courtroom statuses for the day.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="court-sessions"]',
    content: 'Daily Sessions tracks which courts are in session, adjourned, or dark.',
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '[data-tour="court-term-board"]',
    content: 'The Term Sheet Board shows the criminal term assignment sheet. Upload new terms or edit existing ones.',
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '[data-tour="court-upload"]',
    content: 'Upload a daily court report PDF. The system will parse it and populate the board automatically.',
    placement: 'left',
    disableBeacon: true,
  },
  {
    target: '[data-tour="court-personnel"]',
    content: 'Assign judges and staff to courtrooms using the dropdown selectors. Changes save automatically.',
    placement: 'top',
    disableBeacon: true,
  },
];

export const keysMgmtTour: Step[] = [
  {
    target: 'body',
    content: 'Keys Management tracks physical keys — inventory, requests, orders, assignments, and audit logs.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="keys-tabs"]',
    content: 'Switch between Inventory, Requests, Orders, Assignments, and History tabs.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="keys-create"]',
    content: 'Click "Create Key" to add a new key to inventory. Specify the type, number, and building.',
    placement: 'left',
    disableBeacon: true,
  },
  {
    target: '[data-tour="keys-request-card"]',
    content: 'Pending key requests appear here. Review and Approve or Reject each one.',
    placement: 'top',
    disableBeacon: true,
  },
];

export const inventoryTour: Step[] = [
  {
    target: 'body',
    content: 'Inventory Management tracks supplies and materials — stock levels, categories, and reorder points.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="inventory-search"]',
    content: 'Search for items by name or category. The search works across all fields.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="inventory-add"]',
    content: 'Click "Add Item" to create a new inventory item with quantity, category, and reorder point.',
    placement: 'left',
    disableBeacon: true,
  },
  {
    target: '[data-tour="inventory-alerts"]',
    content: 'Low stock alerts appear when items drop below their reorder point. Check these regularly.',
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '[data-tour="inventory-export"]',
    content: 'Export your inventory as CSV for reporting or backup.',
    placement: 'left',
    disableBeacon: true,
  },
];

export const accessAssignmentsTour: Step[] = [
  {
    target: 'body',
    content: 'Access & Assignments is your personnel hub — manage people, room assignments, and key assignments.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="personnel-search"]',
    content: 'Search the personnel directory by name, title, or department.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="personnel-card"]',
    content: 'Click any person\'s card to view their details, assign rooms, or assign keys.',
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '[data-tour="personnel-export"]',
    content: 'Export the full directory as CSV for reporting.',
    placement: 'left',
    disableBeacon: true,
  },
];

export const userDashboardTour: Step[] = [
  {
    target: 'body',
    content: '👋 Welcome to your Dashboard! This is your personal hub for submitting requests and tracking everything you need. Let\'s explore the key features.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="quick-actions"]',
    content: '⚡ Quick Actions: One-click access to common tasks. Request supplies, report facility issues, or request keys without navigating through menus.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="my-requests"]',
    content: '📋 My Requests: Track all your pending requests in one place. Click any request card to view details, add notes, or check status updates.',
    placement: 'top',
    disableBeacon: true,
  },
];

export const tasksTour: Step[] = [
  {
    target: 'body',
    content: 'Task Management shows your assigned and available tasks. Claim tasks, update status, and track progress.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="tasks-list"]',
    content: 'Your tasks are listed here. Each card shows the task type, priority, and current status.',
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '[data-tour="tasks-claim"]',
    content: 'Available tasks can be claimed by clicking the "Claim" button. Once claimed, they\'re assigned to you.',
    placement: 'top',
    disableBeacon: true,
  },
];

export const supplyRoomTour: Step[] = [
  {
    target: 'body',
    content: '📦 Welcome to the Supply Room! This is where you fulfill supply requests from court staff. This tour will show you the complete workflow from receiving orders to delivery.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="supply-orders"]',
    content: '📋 Pending Orders: Approved supply requests appear here. Click "Accept Order" to claim one and start fulfilling it. Orders are assigned to you once accepted.',
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '[data-tour="supply-status"]',
    content: '🔄 Status Workflow: Update status as you work through each step:\n1️⃣ Picking - Gathering items\n2️⃣ Ready - Items ready for pickup\n3️⃣ Completed - Delivered to requester',
    placement: 'top',
    disableBeacon: true,
  },
];

export const profileTour: Step[] = [
  {
    target: 'body',
    content: 'This is your Profile & Settings page. Update your personal info, change your theme, and manage notification preferences.',
    placement: 'center',
    disableBeacon: true,
  },
];

export const myActivityTour: Step[] = [
  {
    target: 'body',
    content: 'My Activity shows all your supply requests, reported issues, and key requests in one place. Use the tabs to switch between categories.',
    placement: 'center',
    disableBeacon: true,
  },
];

export const requestHubTour: Step[] = [
  {
    target: 'body',
    content: 'The Request Hub is your starting point for all requests — order supplies, report issues, request keys, or ask for help.',
    placement: 'center',
    disableBeacon: true,
  },
];

export const roleDashboardTour: Step[] = [
  {
    target: 'body',
    content: 'Welcome to your role dashboard! This shows stats, quick actions, and recent activity tailored to your role.',
    placement: 'center',
    disableBeacon: true,
  },
];

/** Map route paths to their tour steps */
export function getTourForRoute(pathname: string): { steps: Step[]; title: string } | null {
  if (pathname === '/') return { steps: adminDashboardTour, title: 'Admin Dashboard' };
  if (pathname === '/spaces') return { steps: spacesMgmtTour, title: 'Rooms Management' };
  if (pathname === '/operations') return { steps: operationsTour, title: 'Operations Center' };
  if (pathname === '/court-operations') return { steps: courtOpsTour, title: 'Court Operations' };
  if (pathname === '/keys') return { steps: keysMgmtTour, title: 'Keys Management' };
  if (pathname === '/inventory') return { steps: inventoryTour, title: 'Inventory Management' };
  if (pathname === '/access-assignments') return { steps: accessAssignmentsTour, title: 'Access & Assignments' };
  if (pathname === '/dashboard') return { steps: userDashboardTour, title: 'Your Dashboard' };
  if (pathname === '/tasks') return { steps: tasksTour, title: 'Task Management' };
  if (pathname === '/supply-room') return { steps: supplyRoomTour, title: 'Supply Room' };
  if (pathname === '/profile') return { steps: profileTour, title: 'Profile & Settings' };
  if (pathname === '/my-activity') return { steps: myActivityTour, title: 'My Activity' };
  if (pathname === '/request') return { steps: requestHubTour, title: 'Request Hub' };
  if (pathname === '/court-officer-dashboard') return { steps: roleDashboardTour, title: 'Court Officer Dashboard' };
  if (pathname === '/cmc-dashboard') return { steps: roleDashboardTour, title: 'CMC Dashboard' };
  if (pathname === '/court-aide-dashboard') return { steps: roleDashboardTour, title: 'Court Aide Dashboard' };
  return null;
}

/** All available tours for the Help Center */
export const allTours = [
  { id: 'admin-dashboard', title: 'Admin Dashboard', path: '/', description: 'Overview of the main admin hub, navigation, and notifications.', steps: adminDashboardTour },
  { id: 'spaces', title: 'Rooms Management', path: '/spaces', description: 'Manage buildings, floors, and rooms.', steps: spacesMgmtTour },
  { id: 'operations', title: 'Operations Center', path: '/operations', description: 'Track issues, maintenance, and supply requests.', steps: operationsTour },
  { id: 'court-ops', title: 'Court Operations', path: '/court-operations', description: 'Manage courtroom sessions, terms, and personnel.', steps: courtOpsTour },
  { id: 'keys', title: 'Keys Management', path: '/keys', description: 'Track key inventory, requests, and assignments.', steps: keysMgmtTour },
  { id: 'inventory', title: 'Inventory Management', path: '/inventory', description: 'Manage supply stock levels and reorder points.', steps: inventoryTour },
  { id: 'access', title: 'Access & Assignments', path: '/access-assignments', description: 'Manage personnel, room assignments, and key assignments.', steps: accessAssignmentsTour },
  { id: 'user-dashboard', title: 'User Dashboard', path: '/dashboard', description: 'Your personal hub for requests and activity.', steps: userDashboardTour },
  { id: 'tasks', title: 'Task Management', path: '/tasks', description: 'View, claim, and manage assigned tasks.', steps: tasksTour },
  { id: 'supply-room', title: 'Supply Room', path: '/supply-room', description: 'Fulfill supply requests and manage orders.', steps: supplyRoomTour },
  { id: 'profile', title: 'Profile & Settings', path: '/profile', description: 'Update your personal info and preferences.', steps: profileTour },
  { id: 'my-activity', title: 'My Activity', path: '/my-activity', description: 'View all your requests and reported issues.', steps: myActivityTour },
  { id: 'request-hub', title: 'Request Hub', path: '/request', description: 'Start any type of request from one place.', steps: requestHubTour },
];
