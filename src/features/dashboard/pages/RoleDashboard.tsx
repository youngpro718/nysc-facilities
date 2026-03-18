/**
 * RoleDashboard - Streamlined dashboard for CMC, Court Officer, Court Aide
 *
 * Replaces card-heavy grids with compact inline stats and focused content.
 */

import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@features/auth/hooks/useAuth';
import { useRolePermissions } from '@features/auth/hooks/useRolePermissions';
import { TermSheetBoard } from '@features/court/components/court-operations/personnel/TermSheetBoard';
import { supabase } from '@/lib/supabase';
import { getRoleDashboardConfig } from '@/config/roleDashboardConfig';
import { Loader2, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function RoleDashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { userRole, loading: roleLoading } = useRolePermissions();

  const config = getRoleDashboardConfig(userRole || '');

  // ── Data queries (same as before, kept lean) ──

  const { data: supplyRequests = [] } = useQuery({
    queryKey: ['role-dashboard-supply-requests', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase.from('supply_requests').select('id, status').eq('requester_id', user.id).not('status', 'in', '(completed,cancelled)');
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: myIssues = [] } = useQuery({
    queryKey: ['role-dashboard-issues', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase.from('issues').select('id, status').eq('reported_by', user.id).not('status', 'in', '(resolved,closed)');
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: pendingRequestsCount = 0 } = useQuery({
    queryKey: ['role-dashboard-pending-requests'],
    queryFn: async () => {
      const { count } = await supabase.from('supply_requests').select('*', { count: 'exact', head: true }).in('status', ['pending', 'approved']);
      return count || 0;
    },
    enabled: userRole === 'court_aide',
  });

  const { data: availableTasksCount = 0 } = useQuery({
    queryKey: ['role-dashboard-available-tasks'],
    queryFn: async () => {
      const { count } = await supabase.from('staff_tasks').select('*', { count: 'exact', head: true }).eq('status', 'approved').is('claimed_by', null);
      return count || 0;
    },
    enabled: userRole === 'court_aide',
  });

  const { data: myActiveTasksCount = 0 } = useQuery({
    queryKey: ['role-dashboard-my-active-tasks', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { count } = await supabase.from('staff_tasks').select('*', { count: 'exact', head: true }).or(`claimed_by.eq.${user.id},assigned_to.eq.${user.id}`).in('status', ['claimed', 'in_progress']);
      return count || 0;
    },
    enabled: userRole === 'court_aide' && !!user?.id,
  });

  const { data: courtroomStats } = useQuery({
    queryKey: ['role-dashboard-courtrooms'],
    queryFn: async () => {
      const { data } = await supabase.from('court_rooms').select('id, is_active');
      const total = data?.length || 0;
      const active = data?.filter(r => r.is_active).length || 0;
      return { total, active };
    },
    enabled: userRole === 'cmc' || userRole === 'court_officer',
  });

  const { data: keyStats } = useQuery({
    queryKey: ['role-dashboard-key-stats'],
    queryFn: async () => {
      const { data } = await supabase.from('key_assignments').select('id, status');
      const total = data?.length || 0;
      const checkedOut = data?.filter(k => k.status === 'checked_out').length || 0;
      return { total, checkedOut };
    },
    enabled: userRole === 'court_officer',
  });

  const { data: recentActivity = [] } = useQuery({
    queryKey: ['role-dashboard-activity', user?.id, userRole],
    queryFn: async () => {
      const [issuesResult, supplyResult] = await Promise.all([
        supabase.from('issues').select('id, title, status, created_at').order('created_at', { ascending: false }).limit(3),
        supabase.from('supply_requests').select('id, status, created_at').order('created_at', { ascending: false }).limit(3),
      ]);
      const activities: { id: string; type: string; message: string; time: string; status: string; sortKey: string }[] = [];
      issuesResult.data?.forEach(issue => {
        activities.push({ id: issue.id, type: 'issue', message: `Issue: ${issue.title}`, time: formatDistanceToNow(new Date(issue.created_at), { addSuffix: true }), status: issue.status, sortKey: issue.created_at });
      });
      supplyResult.data?.forEach(req => {
        activities.push({ id: req.id, type: 'supply', message: `Supply request ${req.status}`, time: formatDistanceToNow(new Date(req.created_at), { addSuffix: true }), status: req.status, sortKey: req.created_at });
      });
      return activities.sort((a, b) => b.sortKey.localeCompare(a.sortKey)).slice(0, 5);
    },
  });

  // ── Loading / fallback ──

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!config) {
    navigate('/dashboard');
    return null;
  }

  const firstName = profile?.first_name || config.greeting;

  // ── Inline stat helpers per role ──

  const inlineStats: { label: string; value: string | number; onClick?: () => void }[] = [];

  if (userRole === 'cmc') {
    inlineStats.push(
      { label: 'Active Courtrooms', value: `${courtroomStats?.active || 0}/${courtroomStats?.total || 0}`, onClick: () => navigate('/court-operations') },
      { label: 'My Issues', value: myIssues.length, onClick: () => navigate('/my-activity') },
    );
  } else if (userRole === 'court_officer') {
    inlineStats.push(
      { label: 'Keys Issued', value: keyStats?.total || 0, onClick: () => navigate('/keys') },
      { label: 'Checked Out', value: keyStats?.checkedOut || 0, onClick: () => navigate('/keys') },
    );
  } else if (userRole === 'court_aide') {
    inlineStats.push(
      { label: 'Available Tasks', value: availableTasksCount, onClick: () => navigate('/tasks') },
      { label: 'Supply Requests', value: pendingRequestsCount, onClick: () => navigate('/supply-room') },
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* ── Compact header with inline stats ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Welcome back, {firstName}</h1>
            <p className="text-sm text-muted-foreground">{config.title}</p>
          </div>
          <div className="flex items-center gap-2">
            {config.secondaryAction && (
              <Button variant="outline" size="sm" onClick={() => navigate(config.secondaryAction!.path)}>
                <config.secondaryAction.icon className="mr-1.5 h-4 w-4" />
                {config.secondaryAction.label}
              </Button>
            )}
            <Button size="sm" onClick={() => navigate(config.primaryAction.path)}>
              <config.primaryAction.icon className="mr-1.5 h-4 w-4" />
              {config.primaryAction.label}
            </Button>
          </div>
        </div>

        {/* Inline stats strip */}
        {inlineStats.length > 0 && (
          <div className="flex gap-3">
            {inlineStats.map((stat) => (
              <button
                key={stat.label}
                onClick={stat.onClick}
                className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-left hover:bg-accent transition-colors"
              >
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Info banner (purchasing staff) ── */}
      {config.infoBanner && (
        <div className="flex items-start gap-3 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-4">
          <config.infoBanner.icon className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-blue-900 dark:text-blue-100 text-sm">{config.infoBanner.title}</p>
            <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">{config.infoBanner.description}</p>
          </div>
        </div>
      )}

      {/* ── Role-specific focused content ── */}
      {userRole === 'court_aide' && (
        <FocusedTaskList
          myActive={myActiveTasksCount}
          available={availableTasksCount}
          pending={pendingRequestsCount}
          navigate={navigate}
        />
      )}

      {/* ── Recent Activity ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Recent Activity</h2>
          <Button variant="link" size="sm" className="text-xs h-auto p-0" onClick={() => navigate('/my-activity')}>
            View all <ChevronRight className="h-3 w-3 ml-0.5" />
          </Button>
        </div>
        {recentActivity.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No recent activity</p>
        ) : (
          <div className="space-y-2">
            {recentActivity.map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
                <div className={`h-2 w-2 rounded-full shrink-0 ${
                  a.status === 'resolved' || a.status === 'completed' ? 'bg-[hsl(var(--status-operational))]' :
                  a.status === 'in_progress' || a.status === 'picking' ? 'bg-[hsl(var(--status-info))]' :
                  'bg-[hsl(var(--status-warning))]'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{a.message}</p>
                  <p className="text-xs text-muted-foreground">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Term Sheet (CMC + Court Officer) ── */}
      {config.showTermSheet && (
        <div className="pt-2">
          <TermSheetBoard />
        </div>
      )}
    </div>
  );
}

/* ── Court Aide focused task overview ── */
function FocusedTaskList({
  myActive,
  available,
  pending,
  navigate,
}: {
  myActive: number;
  available: number;
  pending: number;
  navigate: (path: string) => void;
}) {
  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Work Queue</h2>
      <button
        onClick={() => navigate('/tasks')}
        className="flex items-center gap-4 w-full rounded-xl border border-border bg-card px-5 py-4 text-left hover:bg-accent transition-colors"
      >
        <div className="flex-1">
          <span className="text-base font-medium text-foreground">My Active Tasks</span>
          <p className="text-xs text-muted-foreground mt-0.5">{myActive} in progress · {available} available to claim</p>
        </div>
        <Badge variant={available > 0 ? 'default' : 'secondary'}>{available}</Badge>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </button>
      <button
        onClick={() => navigate('/supply-room')}
        className="flex items-center gap-4 w-full rounded-xl border border-border bg-card px-5 py-4 text-left hover:bg-accent transition-colors"
      >
        <div className="flex-1">
          <span className="text-base font-medium text-foreground">Supply Room</span>
          <p className="text-xs text-muted-foreground mt-0.5">{pending} requests awaiting fulfillment</p>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </button>
    </div>
  );
}
