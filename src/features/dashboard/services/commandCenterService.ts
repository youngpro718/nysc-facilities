/**
 * Command Center Service
 * 
 * Unified service for fetching real-time metrics and system health data
 * for the admin command center dashboard
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface SystemMetrics {
  issues: IssueMetrics;
  supply: SupplyMetrics;
  tasks: TaskMetrics;
  rooms: RoomMetrics;
  users: UserMetrics;
  court: CourtMetrics;
}

export interface IssueMetrics {
  total: number;
  open: number;
  in_progress: number;
  resolved: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  today: number;
  this_week: number;
  avg_resolution_time_hours: number | null;
}

export interface SupplyMetrics {
  total_requests: number;
  pending_approval: number;
  submitted: number;
  in_progress: number;
  ready: number;
  completed_today: number;
  low_stock_items: number;
}

export interface TaskMetrics {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  overdue: number;
  due_today: number;
}

export interface RoomMetrics {
  total: number;
  active: number;
  maintenance: number;
  inactive: number;
  health_percentage: number;
}

export interface UserMetrics {
  total_users: number;
  active_users: number;
  pending_approval: number;
  suspended: number;
  online_now: number;
}

export interface CourtMetrics {
  total_rooms: number;
  operational: number;
  maintenance: number;
  sessions_today: number;
  active_terms: number;
}

export interface RecentActivity {
  id: string;
  type: 'issue' | 'supply_request' | 'task' | 'user_action';
  title: string;
  description?: string;
  user_name?: string;
  timestamp: string;
  status?: string;
  priority?: string;
  metadata?: Record<string, unknown>;
}

export interface SystemAlert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  category: 'system' | 'security' | 'performance' | 'maintenance';
  title: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

// ============================================================================
// METRICS FETCHING
// ============================================================================

/**
 * Fetch comprehensive system metrics for command center
 */
export async function getSystemMetrics(): Promise<SystemMetrics> {
  try {
    const [issues, supply, tasks, rooms, users, court] = await Promise.all([
      getIssueMetrics(),
      getSupplyMetrics(),
      getTaskMetrics(),
      getRoomMetrics(),
      getUserMetrics(),
      getCourtMetrics(),
    ]);

    return { issues, supply, tasks, rooms, users, court };
  } catch (error) {
    logger.error('Failed to fetch system metrics:', error);
    throw error;
  }
}

/**
 * Fetch issue metrics using the RPC function
 */
async function getIssueMetrics(): Promise<IssueMetrics> {
  const { data, error } = await supabase.rpc('get_issue_stats');
  if (error) throw error;

  // Calculate average resolution time
  const { data: resolvedIssues } = await supabase
    .from('issues')
    .select('created_at, updated_at')
    .eq('status', 'resolved')
    .gte('updated_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .limit(100);

  let avg_resolution_time_hours = null;
  if (resolvedIssues && resolvedIssues.length > 0) {
    const totalHours = resolvedIssues.reduce((sum, issue) => {
      const created = new Date(issue.created_at).getTime();
      const resolved = new Date(issue.updated_at).getTime();
      return sum + (resolved - created) / (1000 * 60 * 60);
    }, 0);
    avg_resolution_time_hours = Math.round(totalHours / resolvedIssues.length);
  }

  return {
    total: data.total || 0,
    open: data.open || 0,
    in_progress: data.in_progress || 0,
    resolved: data.resolved || 0,
    critical: data.critical || 0,
    high: data.high || 0,
    medium: data.medium || 0,
    low: data.low || 0,
    today: data.today || 0,
    this_week: data.this_week || 0,
    avg_resolution_time_hours,
  };
}

/**
 * Fetch supply request metrics
 */
async function getSupplyMetrics(): Promise<SupplyMetrics> {
  const { data: requests } = await supabase
    .from('supply_requests')
    .select('status, created_at');

  // Fetch low stock items using a filter query
  const { data: allItems } = await supabase
    .from('inventory_items')
    .select('quantity, minimum_quantity');

  const requestList = requests || [];
  const today = new Date().toISOString().split('T')[0];
  
  // Calculate low stock items in JavaScript
  const lowStockItems = (allItems || []).filter(
    item => item.quantity < (item.minimum_quantity || 0)
  );

  return {
    total_requests: requestList.length,
    pending_approval: requestList.filter(r => r.status === 'pending_approval').length,
    submitted: requestList.filter(r => r.status === 'submitted').length,
    in_progress: requestList.filter(r => r.status === 'picking' || r.status === 'received').length,
    ready: requestList.filter(r => r.status === 'ready').length,
    completed_today: requestList.filter(r => 
      r.status === 'completed' && r.created_at?.startsWith(today)
    ).length,
    low_stock_items: lowStockItems.length,
  };
}

/**
 * Fetch task metrics
 */
async function getTaskMetrics(): Promise<TaskMetrics> {
  const { data: tasks } = await supabase
    .from('staff_tasks')
    .select('status, due_date');

  const taskList = tasks || [];
  const today = new Date().toISOString().split('T')[0];
  const now = new Date();

  return {
    total: taskList.length,
    pending: taskList.filter(t => t.status === 'pending').length,
    in_progress: taskList.filter(t => t.status === 'in_progress').length,
    completed: taskList.filter(t => t.status === 'completed').length,
    overdue: taskList.filter(t => 
      t.due_date && new Date(t.due_date) < now && t.status !== 'completed'
    ).length,
    due_today: taskList.filter(t => t.due_date?.startsWith(today)).length,
  };
}

/**
 * Fetch room health metrics
 */
async function getRoomMetrics(): Promise<RoomMetrics> {
  const { data: rooms } = await supabase
    .from('rooms')
    .select('status');

  const roomList = rooms || [];
  const total = roomList.length || 1;
  const active = roomList.filter(r => 
    r.status === 'active' || r.status === 'available'
  ).length;

  return {
    total: roomList.length,
    active,
    maintenance: roomList.filter(r => r.status === 'maintenance').length,
    inactive: roomList.filter(r => r.status === 'inactive' || r.status === 'closed').length,
    health_percentage: Math.round((active / total) * 100),
  };
}

/**
 * Fetch user metrics
 */
async function getUserMetrics(): Promise<UserMetrics> {
  const { data: profiles } = await supabase
    .from('profiles')
    .select('is_approved, is_suspended, verification_status');

  const users = profiles || [];

  return {
    total_users: users.length,
    active_users: users.filter(u => u.is_approved && !u.is_suspended).length,
    pending_approval: users.filter(u => !u.is_approved || u.verification_status === 'pending').length,
    suspended: users.filter(u => u.is_suspended).length,
    online_now: 0, // Would need realtime presence tracking
  };
}

/**
 * Fetch court operations metrics
 */
async function getCourtMetrics(): Promise<CourtMetrics> {
  const today = new Date().toISOString().split('T')[0];

  const [roomsRes, sessionsRes, termsRes] = await Promise.all([
    supabase.from('court_rooms').select('operational_status'),
    supabase.from('court_sessions').select('id', { count: 'exact', head: true }).eq('session_date', today),
    supabase
      .from('court_terms')
      .select('id', { count: 'exact', head: true })
      .gte('end_date', today),
  ]);

  const rooms = roomsRes.data || [];

  return {
    total_rooms: rooms.length,
    operational: rooms.filter(r => r.operational_status === 'active' || r.operational_status === 'operational').length,
    maintenance: rooms.filter(r => r.operational_status === 'maintenance').length,
    sessions_today: sessionsRes.count || 0,
    active_terms: termsRes.count || 0,
  };
}

// ============================================================================
// ACTIVITY TRACKING
// ============================================================================

/**
 * Fetch recent system activity
 */
export async function getRecentActivity(limit: number = 20): Promise<RecentActivity[]> {
  const activities: RecentActivity[] = [];

  // Fetch recent issues
  const { data: issues } = await supabase
    .from('issues')
    .select('id, title, status, priority, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (issues) {
    activities.push(...issues.map((issue: any) => ({
      id: issue.id,
      type: 'issue' as const,
      title: issue.title,
      timestamp: issue.created_at,
      status: issue.status,
      priority: issue.priority,
    })));
  }

  // Fetch recent supply requests
  const { data: supplies } = await supabase
    .from('supply_requests')
    .select('id, title, status, created_at, profiles!requester_id(first_name, last_name)')
    .order('created_at', { ascending: false })
    .limit(10);

  if (supplies) {
    activities.push(...supplies.map((req: any) => ({
      id: req.id,
      type: 'supply_request' as const,
      title: req.title,
      user_name: req.profiles ? `${req.profiles.first_name} ${req.profiles.last_name}` : undefined,
      timestamp: req.created_at,
      status: req.status,
    })));
  }

  // Sort by timestamp and limit
  return activities
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}

// ============================================================================
// SYSTEM ALERTS
// ============================================================================

/**
 * Generate system alerts based on current metrics
 */
export async function getSystemAlerts(): Promise<SystemAlert[]> {
  const alerts: SystemAlert[] = [];
  const metrics = await getSystemMetrics();

  // Critical issues alert
  if (metrics.issues.critical > 0) {
    alerts.push({
      id: 'critical-issues',
      severity: 'critical',
      category: 'maintenance',
      title: 'Critical Issues Detected',
      message: `${metrics.issues.critical} critical ${metrics.issues.critical === 1 ? 'issue' : 'issues'} require immediate attention`,
      timestamp: new Date().toISOString(),
      acknowledged: false,
    });
  }

  // Low stock alert
  if (metrics.supply.low_stock_items > 5) {
    alerts.push({
      id: 'low-stock',
      severity: 'warning',
      category: 'maintenance',
      title: 'Low Stock Items',
      message: `${metrics.supply.low_stock_items} inventory items are below minimum quantity`,
      timestamp: new Date().toISOString(),
      acknowledged: false,
    });
  }

  // Pending approvals alert
  if (metrics.supply.pending_approval > 10) {
    alerts.push({
      id: 'pending-approvals',
      severity: 'warning',
      category: 'system',
      title: 'Pending Supply Approvals',
      message: `${metrics.supply.pending_approval} supply requests awaiting approval`,
      timestamp: new Date().toISOString(),
      acknowledged: false,
    });
  }

  // Room health alert
  if (metrics.rooms.health_percentage < 70) {
    alerts.push({
      id: 'room-health',
      severity: metrics.rooms.health_percentage < 50 ? 'critical' : 'warning',
      category: 'maintenance',
      title: 'Room Health Below Threshold',
      message: `Only ${metrics.rooms.health_percentage}% of rooms are operational`,
      timestamp: new Date().toISOString(),
      acknowledged: false,
    });
  }

  // Overdue tasks alert
  if (metrics.tasks.overdue > 0) {
    alerts.push({
      id: 'overdue-tasks',
      severity: 'warning',
      category: 'system',
      title: 'Overdue Tasks',
      message: `${metrics.tasks.overdue} ${metrics.tasks.overdue === 1 ? 'task is' : 'tasks are'} overdue`,
      timestamp: new Date().toISOString(),
      acknowledged: false,
    });
  }

  // User approval backlog
  if (metrics.users.pending_approval > 5) {
    alerts.push({
      id: 'user-approvals',
      severity: 'info',
      category: 'security',
      title: 'Pending User Approvals',
      message: `${metrics.users.pending_approval} users awaiting approval`,
      timestamp: new Date().toISOString(),
      acknowledged: false,
    });
  }

  return alerts.sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}
