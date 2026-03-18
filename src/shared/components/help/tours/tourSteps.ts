import { Step } from 'react-joyride';

/**
 * Tour step definitions for each page/module.
 * Targets use CSS selectors — data-tour attributes are added to key UI elements.
 * Falls back to body if the target element isn't found.
 */

export const adminDashboardTour: Step[] = [
  {
    target: 'body',
    content: 'Welcome to the Admin Dashboard! This is your command center for managing the entire facility. Let\'s walk through the key areas.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="nav-bar"]',
    content: 'This is your navigation bar. Each icon represents a module — hover to see the name, click to navigate. The icons change based on your role.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="notification-box"]',
    content: 'The notification bell shows real-time alerts. A red badge means you have unread notifications. Click to view and manage them.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="theme-toggle"]',
    content: 'Toggle between light and dark mode. Your preference is saved automatically.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="user-avatar"]',
    content: 'Click your avatar to go to your Profile page where you can update your info and settings.',
    placement: 'bottom',
    disableBeacon: true,
  },
];

export const spacesMgmtTour: Step[] = [
  {
    target: 'body',
    content: 'Spaces Management lets you manage the physical hierarchy: Buildings → Floors → Rooms & Hallways. Let\'s explore.',
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
    content: 'Then pick a floor to see its rooms, hallways, and floor plan.',
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
  {
    target: '[data-tour="floor-plan-tab"]',
    content: 'Switch to Floor Plan view for a visual 2D or 3D layout of the floor. You can drag objects to rearrange them.',
    placement: 'bottom',
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

export const lightingTour: Step[] = [
  {
    target: 'body',
    content: 'Lighting Management helps you track and inspect every light fixture in the building. Designed for walkthrough inspections.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="lighting-tabs"]',
    content: 'Two views: Dashboard shows health metrics and stats. Floor View is the interactive inspection tool.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="lighting-floor-accordion"]',
    content: 'Each floor expands to show its hallway sections. Click a floor to expand it.',
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '[data-tour="lighting-fixture-grid"]',
    content: 'Each dot represents a light fixture. Green = Working, Red = Out, Amber = Ballast issue. TAP any dot to cycle its status.',
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '[data-tour="lighting-add-section"]',
    content: 'Click "+ Add Section" to create a new hallway section. Set the name, direction, fixture count, and bulb technology.',
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '[data-tour="lighting-walkthrough"]',
    content: 'Click "Walkthrough" on any hallway to step through fixtures one by one — perfect for physical inspections.',
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '[data-tour="lighting-legend"]',
    content: 'The legend shows what each color means. Use it as a quick reference during inspections.',
    placement: 'bottom',
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
    content: 'Welcome to your Dashboard! This is your personal hub for submitting requests and tracking their status.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="quick-actions"]',
    content: 'Quick action buttons let you request supplies, report issues, or request keys with one click.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="my-requests"]',
    content: 'Your pending requests and their current statuses appear here. Click any to see details.',
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
    content: 'The Supply Room is where you fulfill supply requests. Claim orders, pick items, and mark them as delivered.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="supply-orders"]',
    content: 'Approved supply requests appear here. Claim one to start fulfilling it.',
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '[data-tour="supply-status"]',
    content: 'Update the status as you work: Picking → Ready → Completed.',
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
  if (pathname === '/spaces') return { steps: spacesMgmtTour, title: 'Spaces Management' };
  if (pathname === '/operations') return { steps: operationsTour, title: 'Operations Center' };
  if (pathname === '/lighting') return { steps: lightingTour, title: 'Lighting Management' };
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
  { id: 'spaces', title: 'Spaces Management', path: '/spaces', description: 'Manage buildings, floors, rooms, and floor plans.', steps: spacesMgmtTour },
  { id: 'operations', title: 'Operations Center', path: '/operations', description: 'Track issues, maintenance, and supply requests.', steps: operationsTour },
  { id: 'lighting', title: 'Lighting Management', path: '/lighting', description: 'Inspect and manage lighting fixtures floor by floor.', steps: lightingTour },
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
