/**
 * CMC Dashboard — Command Center
 * 
 * Purpose-built for Court Management Coordinators:
 * - Courtroom health overview
 * - Personal workspace (issues, supplies)
 * - Court term overview
 */

import { useNavigate } from 'react-router-dom';
import { useAuth } from '@features/auth/hooks/useAuth';
import { useNotifications } from '@shared/hooks/useNotifications';
import { useUserIssues } from '@features/dashboard/hooks/useUserIssues';
import { useSupplyRequests } from '@features/supply/hooks/useSupplyRequests';
import { useCMCMetrics } from '@features/court/hooks/useCMCMetrics';
import { NotificationDropdown } from '@shared/components/user/NotificationDropdown';
import { CompactHeader } from '@shared/components/user/CompactHeader';
import { TermSheetPreview } from '@shared/components/user/TermSheetPreview';
import { StatusCard } from '@/components/ui/StatusCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QuickIssueReportButton } from '@shared/components/user/QuickIssueReportButton';
import { useUserPersonnelInfo } from '@features/court/hooks/useUserPersonnelInfo';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import {
  Gavel, AlertTriangle, Package, ArrowRight,
  Activity, Scale, Clock, AlertCircle, Loader2
} from 'lucide-react';

export default function CMCDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { data: personnelInfo } = useUserPersonnelInfo(user?.id);
  const { data: cmcMetrics, isLoading: metricsLoading, error: metricsError } = useCMCMetrics(3);

  const firstName = profile?.first_name || user?.user_metadata?.first_name || 'there';
  const lastName = profile?.last_name || user?.user_metadata?.last_name || '';

  const {
    notifications = [],
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
  } = useNotifications(user?.id);

  const { userIssues = [], isLoading: issuesLoading } = useUserIssues(user?.id);
  const { data: supplyRequests = [], isLoading: supplyLoading } = useSupplyRequests(user?.id);

  const openIssues = userIssues.filter(i => i.status === 'open' || i.status === 'in_progress');
  const activeSupplies = supplyRequests.filter(r => !['completed', 'fulfilled', 'cancelled'].includes(r.status));

  const health = cmcMetrics?.courtroomHealth || { operational: 0, maintenance: 0, inactive: 0, total: 1, healthPercent: 0 };
  const healthPercent = health.healthPercent;
  const todaySessions = cmcMetrics?.todaySessions ?? 0;
  const termInfo = cmcMetrics?.activeTerms || [];

  // Show loading state
  if (metricsLoading || issuesLoading || supplyLoading) {
    return (
      <div className="space-y-5 pb-20 px-3 sm:px-0">
        <div className="flex items-start justify-between gap-3 pt-2">
          <Skeleton className="h-16 w-64" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[110px]" />
          ))}
        </div>
      </div>
    );
  }

  // Show error state
  if (metricsError) {
    return (
      <div className="space-y-5 pb-20 px-3 sm:px-0">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load CMC dashboard metrics. Please refresh the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-20 px-3 sm:px-0">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 pt-2">
        <CompactHeader
          firstName={firstName}
          lastName={lastName}
          title={(profile as any)?.title || personnelInfo?.title || 'Court Management'}
          department={(profile as any)?.department || (personnelInfo as any)?.department}
          roomNumber={(profile as any)?.room_number || personnelInfo?.roomNumber}
          avatarUrl={profile?.avatar_url}
          role="CMC"
        />
        <div className="flex items-center gap-2 flex-shrink-0">
          <NotificationDropdown
            notifications={notifications as any}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
            onClearNotification={clearNotification}
            onClearAllNotifications={clearAllNotifications}
          />
        </div>
      </div>

      {/* Courtroom Health Strip */}
      <Card
        className="cursor-pointer hover:bg-card-hover transition-colors"
        onClick={() => navigate('/court-operations')}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Gavel className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Courtroom Health</span>
            </div>
            <Badge variant={healthPercent >= 80 ? 'default' : healthPercent >= 50 ? 'secondary' : 'destructive'} className="text-xs">
              {healthPercent}% Operational
            </Badge>
          </div>
          <div className="flex gap-1 h-3 rounded-full overflow-hidden bg-muted">
            {health.operational > 0 && (
              <div
                className="bg-[hsl(var(--status-operational))] rounded-l-full transition-all"
                style={{ width: `${(health.operational / health.total) * 100}%` }}
              />
            )}
            {health.maintenance > 0 && (
              <div
                className="bg-[hsl(var(--status-warning))] transition-all"
                style={{ width: `${(health.maintenance / health.total) * 100}%` }}
              />
            )}
            {health.inactive > 0 && (
              <div
                className="bg-[hsl(var(--status-critical))] rounded-r-full transition-all"
                style={{ width: `${(health.inactive / health.total) * 100}%` }}
              />
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-4 mt-2 text-[11px] sm:text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[hsl(var(--status-operational))]" />
              {health.operational} Active
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[hsl(var(--status-warning))]" />
              {health.maintenance} Maintenance
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[hsl(var(--status-critical))]" />
              {health.inactive} Inactive
            </span>
          </div>
        </CardContent>
      </Card>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatusCard
          title="Today's Sessions"
          value={todaySessions ?? 0}
          icon={Scale}
          statusVariant="info"
          onClick={() => navigate('/court-operations')}
        />
        <StatusCard
          title="Active Terms"
          value={termInfo?.length ?? 0}
          subLabel={termInfo?.[0] ? `Next: ${termInfo[0].term_name}` : undefined}
          icon={Activity}
          statusVariant="operational"
          onClick={() => navigate('/term-sheet')}
        />
        <StatusCard
          title="My Open Issues"
          value={openIssues.length}
          icon={AlertTriangle}
          statusVariant={openIssues.length > 0 ? 'warning' : 'operational'}
          onClick={() => navigate('/operations?tab=issues')}
        />
        <StatusCard
          title="My Supplies"
          value={activeSupplies.length}
          icon={Package}
          statusVariant={activeSupplies.length > 0 ? 'info' : 'none'}
          onClick={() => navigate('/my-supply-requests')}
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Left: My Workspace */}
        <div className="space-y-4">
          {/* My Issues */}
          <Card>
            <CardHeader className="pb-2 px-4 pt-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">My Issues</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate('/operations?tab=issues')} className="h-7 text-xs">
                  View All <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              {openIssues.length === 0 ? (
                <p className="text-sm text-muted-foreground py-3 text-center">No open issues</p>
              ) : (
                openIssues.slice(0, 3).map((issue) => (
                  <div
                    key={issue.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => navigate('/operations?tab=issues')}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`h-2 w-2 rounded-full flex-shrink-0 ${
                        issue.priority === 'high' || issue.priority === 'urgent' ? 'bg-[hsl(var(--status-critical))]' :
                        issue.priority === 'medium' ? 'bg-[hsl(var(--status-warning))]' : 'bg-muted-foreground'
                      }`} />
                      <span className="text-sm truncate">{issue.title}</span>
                    </div>
                    <Badge variant="outline" className="text-xs flex-shrink-0 ml-2">{issue.status}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* My Supply Requests */}
          <Card>
            <CardHeader className="pb-2 px-4 pt-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">My Supply Requests</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate('/my-supply-requests')} className="h-7 text-xs">
                  View All <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              {activeSupplies.length === 0 ? (
                <p className="text-sm text-muted-foreground py-3 text-center">No active requests</p>
              ) : (
                activeSupplies.slice(0, 3).map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-sm truncate">{req.description || 'Supply request'}</span>
                    <Badge
                      variant={req.status === 'ready' ? 'default' : 'outline'}
                      className="text-xs flex-shrink-0 ml-2"
                    >
                      {req.status}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <QuickIssueReportButton
              variant="outline"
              size="default"
              label="Report Issue"
              showIcon={true}
              className="h-12"
            />
            <Button
              variant="outline"
              className="h-12"
              onClick={() => navigate('/request/supplies')}
            >
              <Package className="h-4 w-4 mr-2" />
              Order Supplies
            </Button>
          </div>
        </div>

        {/* Right: Court Overview */}
        <div className="space-y-4">
          {/* Upcoming Terms */}
          {termInfo && termInfo.length > 0 && (
            <Card>
              <CardHeader className="pb-2 px-4 pt-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Upcoming Terms</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/term-sheet')} className="h-7 text-xs">
                    View All <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2">
                {termInfo.slice(0, 3).map((term) => (
                  <div
                    key={term.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => navigate('/term-sheet')}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{term.term_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(term.start_date), 'MMM d')} – {format(new Date(term.end_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Term Sheet Preview */}
          <TermSheetPreview maxItems={6} defaultExpanded={false} />
        </div>
      </div>
    </div>
  );
}
