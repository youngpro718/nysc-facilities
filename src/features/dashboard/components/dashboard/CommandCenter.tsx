/**
 * CommandCenter Component
 *
 * Admin operations panel: KPI strip, actionable attention queue,
 * activity timeline, and quick access to admin destinations.
 * Every link routes to a real page.
 */

import { useNavigate } from 'react-router-dom';
import { useCommandCenter } from '@features/dashboard/hooks/useCommandCenter';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertTriangle,
  Package,
  Users,
  Gavel,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  KeyRound,
  Boxes,
  Settings2,
  ChevronRight,
  LayoutGrid,
} from 'lucide-react';

type StatusTone = 'operational' | 'warning' | 'critical' | 'info';

const TONE_DOT: Record<StatusTone, string> = {
  operational: 'bg-emerald-500',
  warning: 'bg-amber-500',
  critical: 'bg-red-500',
  info: 'bg-zinc-400',
};

export function CommandCenter() {
  const navigate = useNavigate();
  const { metrics, alerts, activity, isLoading, refetch } = useCommandCenter();

  if (isLoading) {
    return <CommandCenterSkeleton />;
  }

  if (!metrics) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between gap-3">
          <span>Couldn't load command center metrics.</span>
          <Button variant="outline" size="sm" onClick={() => { refetch(); }}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const criticalAlerts = alerts.filter(a => a.severity === 'critical');
  const warningAlerts = alerts.filter(a => a.severity === 'warning');

  // ── KPI strip ───────────────────────────────────────────────────────────
  const kpis: Array<{
    label: string;
    value: string | number;
    sub: string;
    tone: StatusTone;
    to: string;
  }> = [
    {
      label: 'Active Issues',
      value: metrics.issues.open + metrics.issues.in_progress,
      sub: metrics.issues.critical > 0
        ? `${metrics.issues.critical} critical`
        : `${metrics.issues.today} new today`,
      tone: metrics.issues.critical > 0 ? 'critical' : metrics.issues.open > 10 ? 'warning' : 'operational',
      to: '/operations?tab=issues',
    },
    {
      label: 'Room Health',
      value: `${metrics.rooms.health_percentage}%`,
      sub: `${metrics.rooms.active} of ${metrics.rooms.total} active`,
      tone: metrics.rooms.health_percentage >= 80 ? 'operational' : metrics.rooms.health_percentage >= 60 ? 'warning' : 'critical',
      to: '/spaces',
    },
    {
      label: 'Supply Requests',
      value: metrics.supply.total_requests,
      sub: `${metrics.supply.pending_approval} awaiting approval`,
      tone: metrics.supply.pending_approval > 0 ? 'warning' : 'operational',
      to: '/admin/supply-requests',
    },
    {
      label: 'Open Tasks',
      value: metrics.tasks.pending + metrics.tasks.in_progress,
      sub: metrics.tasks.overdue > 0
        ? `${metrics.tasks.overdue} overdue`
        : `${metrics.tasks.due_today} due today`,
      tone: metrics.tasks.overdue > 0 ? 'warning' : 'operational',
      to: '/tasks',
    },
  ];

  // ── Needs-attention queue (only real, actionable items) ────────────────
  const attention: Array<{
    label: string;
    count: number;
    tone: StatusTone;
    to: string;
  }> = [
    { label: 'Critical issues', count: metrics.issues.critical, tone: 'critical' as StatusTone, to: '/operations?tab=issues' },
    { label: 'Users awaiting approval', count: metrics.users.pending_approval, tone: 'warning' as StatusTone, to: '/admin?tab=users' },
    { label: 'Supply orders to approve', count: metrics.supply.pending_approval, tone: 'warning' as StatusTone, to: '/admin/supply-requests' },
    { label: 'Overdue tasks', count: metrics.tasks.overdue, tone: 'warning' as StatusTone, to: '/tasks' },
    { label: 'Low stock items', count: metrics.supply.low_stock_items, tone: 'info' as StatusTone, to: '/inventory' },
    { label: 'Rooms in maintenance', count: metrics.rooms.maintenance, tone: 'info' as StatusTone, to: '/spaces' },
  ].filter(item => item.count > 0);

  // ── Quick access (every path verified against the router) ──────────────
  const quickLinks = [
    { label: 'Users', to: '/admin?tab=users', icon: Users },
    { label: 'Supply Requests', to: '/admin/supply-requests', icon: Package },
    { label: 'Issues', to: '/operations?tab=issues', icon: AlertTriangle },
    { label: 'Inventory', to: '/inventory', icon: Boxes },
    { label: 'Term Sheet', to: '/term-sheet', icon: Gavel },
    { label: 'Spaces', to: '/spaces', icon: LayoutGrid },
    { label: 'System Settings', to: '/admin?tab=system', icon: Settings2 },
  ];

  const activityTone = (type: string): StatusTone =>
    type === 'issue' ? 'warning' : type === 'supply_request' ? 'operational' : 'info';

  const activityTarget = (type: string): string =>
    type === 'issue' ? '/operations?tab=issues' :
    type === 'supply_request' ? '/admin/supply-requests' :
    type === 'task' ? '/tasks' : '/operations';

  return (
    <section aria-labelledby="command-center-heading" className="space-y-5 border-t border-border pt-6">
      {/* Section header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 id="command-center-heading" className="text-lg font-semibold tracking-tight">
            Command center
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {metrics.users.total_users} users · {metrics.court.operational} of {metrics.court.total_rooms} courtrooms operational
            {metrics.issues.avg_resolution_time_hours ? ` · ${metrics.issues.avg_resolution_time_hours}h avg resolution` : ''}
          </p>
        </div>
        <Button variant="outline" size="sm" className="h-9 bg-card text-xs" onClick={() => { refetch(); }}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Refresh
        </Button>
      </div>

      {/* Critical / warning banner */}
      {criticalAlerts.length > 0 ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between gap-3">
            <span>
              <strong>{criticalAlerts.length} critical alert{criticalAlerts.length !== 1 ? 's' : ''}</strong>
              <span className="block text-sm mt-0.5">{criticalAlerts[0].message}</span>
            </span>
            <Button variant="destructive" size="sm" onClick={() => navigate('/operations?tab=issues')}>
              Review
            </Button>
          </AlertDescription>
        </Alert>
      ) : warningAlerts.length > 0 && (
        <Alert className="rounded-md border-status-warning/35 bg-surface-warning text-surface-warning-foreground">
          <AlertCircle className="h-4 w-4 text-status-warning" />
          <AlertDescription>
            <strong>{warningAlerts.length} warning{warningAlerts.length !== 1 ? 's' : ''}</strong>
            <span className="block text-sm mt-0.5">{warningAlerts[0].message}</span>
          </AlertDescription>
        </Alert>
      )}

      {/* KPI strip — one container, divider-separated cells */}
      <div className="overflow-hidden rounded-md border bg-card">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-border">
          {kpis.map(kpi => (
            <button
              key={kpi.label}
              type="button"
              onClick={() => navigate(kpi.to)}
              className="group flex flex-col items-start gap-1 p-4 text-left transition-colors hover:bg-accent/40 active:translate-y-px sm:p-5"
            >
              <span className="text-xs font-medium text-muted-foreground">
                {kpi.label}
              </span>
              <span className="text-2xl sm:text-3xl font-semibold tabular-nums tracking-tight">
                {kpi.value}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className={`h-1.5 w-1.5 rounded-full ${TONE_DOT[kpi.tone]}`} />
                {kpi.sub}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Attention queue + activity timeline */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        {/* Needs attention */}
        <div className="rounded-md border bg-card">
          <div className="px-4 py-3 border-b">
            <h3 className="text-sm font-semibold">Needs Attention</h3>
          </div>
          {attention.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <CheckCircle2 className="h-7 w-7 text-emerald-500/70" />
              <p className="text-sm font-medium">All clear</p>
              <p className="text-xs text-muted-foreground">Nothing is waiting on you right now</p>
            </div>
          ) : (
            <div className="divide-y">
              {attention.map(item => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => navigate(item.to)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/40 active:scale-[0.995]"
                >
                  <span className={`flex h-6 min-w-6 items-center justify-center rounded-sm px-1.5 text-xs font-semibold tabular-nums text-white ${TONE_DOT[item.tone]}`}>
                    {item.count}
                  </span>
                  <span className="flex-1 text-sm">{item.label}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="rounded-md border bg-card">
          <div className="px-4 py-3 border-b">
            <h3 className="text-sm font-semibold">Recent Activity</h3>
          </div>
          {activity.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No recent activity</p>
          ) : (
            <div className="divide-y">
              {activity.slice(0, 8).map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(activityTarget(item.type))}
                  className="flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors hover:bg-accent/40"
                >
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${TONE_DOT[activityTone(item.type)]}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{item.title}</span>
                    <span className="block text-xs text-muted-foreground">
                      {item.type.replace('_', ' ')}
                      {item.status ? ` · ${item.status}` : ''}
                      {item.user_name ? ` · ${item.user_name}` : ''}
                      {' · '}
                      {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                    </span>
                  </span>
                  {item.priority && (item.priority === 'high' || item.priority === 'urgent') && (
                    <span className="mt-0.5 shrink-0 rounded-sm bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-600 dark:text-red-400">
                      {item.priority}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick access */}
      <div className="border-t border-border pt-4">
        <h3 className="mb-2 text-xs font-medium text-muted-foreground">
          Quick Access
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {quickLinks.map(link => {
            const Icon = link.icon;
            return (
              <button
                key={link.to + link.label}
                type="button"
                onClick={() => navigate(link.to)}
                className="group flex items-center gap-2.5 rounded-md border bg-card px-3 py-2.5 text-left transition-all hover:border-primary/30 hover:bg-accent/40 active:translate-y-px"
              >
                <Icon className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
                <span className="flex-1 truncate text-sm font-medium">{link.label}</span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CommandCenterSkeleton() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Skeleton className="h-6 w-44" />
        <Skeleton className="h-3 w-72" />
      </div>
      <Skeleton className="h-[120px] rounded-md" />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <Skeleton className="h-[280px] rounded-md" />
        <Skeleton className="h-[280px] rounded-md" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-11 rounded-md" />
        ))}
      </div>
    </div>
  );
}
