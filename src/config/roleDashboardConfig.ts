/**
 * Role Dashboard Configuration
 * 
 * Centralized config for role-specific dashboard content.
 * Used by RoleDashboard to render appropriate stats, actions, and sections.
 */

import { 
  Gavel, Package, Warehouse, AlertCircle, TrendingUp, Calendar, 
  Clock, FileText, Wrench, DollarSign, LucideIcon, ClipboardList,
  CheckCircle, User
} from 'lucide-react';

export type DashboardRole = 'cmc' | 'court_aide' | 'purchasing_staff';

export interface RoleDashboardConfig {
  title: string;
  greeting: string;
  primaryAction: {
    label: string;
    path: string;
    icon: LucideIcon;
  };
  secondaryAction?: {
    label: string;
    path: string;
    icon: LucideIcon;
  };
  statsConfig: StatConfig[];
  quickActions: QuickAction[];
  showTermSheet: boolean;
  showPerformanceMetrics: boolean;
  showInventoryAlerts: boolean;
  showPendingRequests: boolean;
  infoBanner?: {
    title: string;
    description: string;
    icon: LucideIcon;
  };
}

export interface StatConfig {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
  clickable?: boolean;
  clickPath?: string;
}

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  path: string;
  color: string;
  bgColor: string;
}

export const roleDashboardConfigs: Record<DashboardRole, RoleDashboardConfig> = {
  cmc: {
    title: 'Court Management Dashboard',
    greeting: 'Court Manager',
    primaryAction: {
      label: 'Court Operations',
      path: '/court-operations',
      icon: Gavel,
    },
    secondaryAction: {
      label: 'Request Supplies',
      path: '/forms/supply-request',
      icon: Package,
    },
    statsConfig: [
      { id: 'activeCourtrooms', label: 'Active Courtrooms', icon: Gavel, description: 'operational' },
      { id: 'myIssues', label: 'My Issues', icon: Wrench, description: 'Open issues you\'ve reported', clickable: true, clickPath: '/my-issues' },
      { id: 'mySupplyRequests', label: 'My Supply Requests', icon: Package, description: 'Active supply requests', clickable: true, clickPath: '/my-supply-requests' },
      { id: 'upcomingTerms', label: 'Upcoming Terms', icon: Calendar, description: 'Next 30 days' },
    ],
    quickActions: [
      { id: 'court-ops', title: 'Court Operations', description: 'Manage courtroom assignments and terms', icon: Gavel, path: '/court-operations', color: 'text-blue-600', bgColor: 'bg-blue-50' },
      { id: 'report-issue', title: 'Report Issue', description: 'Report a facility or maintenance issue', icon: Wrench, path: '/my-issues', color: 'text-orange-600', bgColor: 'bg-orange-50' },
      { id: 'request-supplies', title: 'Request Supplies', description: 'Order office supplies and materials', icon: Package, path: '/forms/supply-request', color: 'text-green-600', bgColor: 'bg-green-50' },
      { id: 'my-supplies', title: 'My Supply Requests', description: 'Track your supply request status', icon: FileText, path: '/my-supply-requests', color: 'text-purple-600', bgColor: 'bg-purple-50' },
    ],
    showTermSheet: true,
    showPerformanceMetrics: true,
    showInventoryAlerts: false,
    showPendingRequests: false,
  },
  court_aide: {
    title: 'Court Aide Dashboard',
    greeting: 'Court Aide',
    primaryAction: {
      label: 'My Tasks',
      path: '/tasks',
      icon: ClipboardList,
    },
    secondaryAction: {
      label: 'Supply Room',
      path: '/supply-room',
      icon: Package,
    },
    statsConfig: [
      { id: 'availableTasks', label: 'Available Tasks', icon: Clock, description: 'Ready to claim', clickable: true, clickPath: '/tasks' },
      { id: 'myActiveTasks', label: 'My Active Tasks', icon: ClipboardList, description: 'In progress', clickable: true, clickPath: '/tasks' },
      { id: 'pendingRequests', label: 'Supply Requests', icon: Package, description: 'Awaiting fulfillment', clickable: true, clickPath: '/supply-room' },
      { id: 'lowStockItems', label: 'Low Stock', icon: AlertCircle, description: 'Need attention', clickable: true, clickPath: '/inventory' },
    ],
    quickActions: [
      { id: 'view-tasks', title: 'View Tasks', description: 'See and claim available tasks', icon: ClipboardList, path: '/tasks', color: 'text-green-600', bgColor: 'bg-green-50' },
      { id: 'supply-room', title: 'Supply Room', description: 'Fulfill supply requests', icon: Package, path: '/supply-room', color: 'text-blue-600', bgColor: 'bg-blue-50' },
      { id: 'inventory', title: 'Inventory', description: 'Manage stock levels and items', icon: Warehouse, path: '/inventory', color: 'text-purple-600', bgColor: 'bg-purple-50' },
      { id: 'my-completed', title: 'My Completed', description: 'View your completed work', icon: CheckCircle, path: '/tasks?tab=completed', color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
    ],
    showTermSheet: false,
    showPerformanceMetrics: true,
    showInventoryAlerts: true,
    showPendingRequests: true,
  },
  purchasing_staff: {
    title: 'Purchasing Dashboard',
    greeting: 'Purchasing Staff',
    primaryAction: {
      label: 'View Inventory',
      path: '/inventory',
      icon: Warehouse,
    },
    statsConfig: [
      { id: 'lowStockItems', label: 'Low Stock Items', icon: AlertCircle, description: 'Need attention' },
      { id: 'pendingRequests', label: 'Pending Requests', icon: FileText, description: 'Awaiting fulfillment' },
      { id: 'reorderRecommendations', label: 'Reorder Recommendations', icon: TrendingUp, description: 'Items to consider' },
    ],
    quickActions: [
      { id: 'inventory', title: 'Inventory Overview', description: 'View stock levels and reorder recommendations', icon: Warehouse, path: '/inventory', color: 'text-purple-600', bgColor: 'bg-purple-50' },
      { id: 'supply-room', title: 'Supply Room', description: 'View supply requests and assist with planning', icon: Package, path: '/supply-room', color: 'text-blue-600', bgColor: 'bg-blue-50' },
      { id: 'supply-requests', title: 'Supply Requests', description: 'View all supply requests', icon: FileText, path: '/admin/supply-requests', color: 'text-green-600', bgColor: 'bg-green-50' },
    ],
    showTermSheet: true,
    showPerformanceMetrics: false,
    showInventoryAlerts: true,
    showPendingRequests: false,
    infoBanner: {
      title: 'Purchasing Support Role',
      description: 'You have view-only access to inventory and supply room data to assist with planning and recommendations. Court Aides handle actual purchase orders and fulfillment.',
      icon: Package,
    },
  },
};

export function getRoleDashboardConfig(role: string): RoleDashboardConfig | null {
  if (role in roleDashboardConfigs) {
    return roleDashboardConfigs[role as DashboardRole];
  }
  return null;
}
