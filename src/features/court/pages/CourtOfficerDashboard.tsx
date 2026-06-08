/**
 * Court Officer Dashboard — Security Hub
 *
 * Surfaces what an officer needs on shift:
 *  - Key inventory + pending requests at a glance
 *  - Today's key activity (checked out / returned)
 *  - Active and recently returned key assignments
 *  - Issues the officer has reported
 *  - Quick actions for Keys, Spaces, Term Sheet, Report Issue
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { QUERY_CONFIG, LIMITS } from '@/config';
import { useAuth } from '@features/auth/hooks/useAuth';
import { useNotifications } from '@shared/hooks/useNotifications';
import { NotificationDropdown } from '@shared/components/user/NotificationDropdown';
import { CompactHeader } from '@shared/components/user/CompactHeader';
import { TermSheetPreview } from '@shared/components/user/TermSheetPreview';
import { StatusCard } from '@/components/ui/StatusCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserPersonnelInfo } from '@features/court/hooks/useUserPersonnelInfo';
import { formatDistanceToNow } from 'date-fns';
import {
  Key, KeyRound, ArrowRight, Shield, Building2, Scale,
  User, Clock, MapPin, AlertTriangle, ArrowDownToLine, ArrowUpFromLine, Wrench,
} from 'lucide-react';

type AssignmentTab = 'active' | 'recent';

export default function CourtOfficerDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { data: personnelInfo } = useUserPersonnelInfo(user?.id);
  const [assignmentTab, setAssignmentTab] = useState<AssignmentTab>('active');

  const firstName = profile?.first_name || user?.user_metadata?.first_name || 'there';
  const lastName = profile?.last_name || user?.user_metadata?.last_name || '';

  const {
    notifications = [],
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
  } = useNotifications(user?.id);

  const todayIso = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  })();

  // Key totals
  const { data: keyStats } = useQuery({
    queryKey: ['officer-key-stats'],
    queryFn: async () => {
      const { count: totalKeys } = await supabase
        .from('key_assignments')
        .select('*', { count: 'exact', head: true });
      const { count: checkedOut } = await supabase
        .from('key_assignments')
        .select('*', { count: 'exact', head: true })
        .is('returned_at', null);
      return {
        total: totalKeys || 0,
        checkedOut: checkedOut || 0,
        available: (totalKeys || 0) - (checkedOut || 0),
      };
    },
    refetchInterval: QUERY_CONFIG.refetch.realtime,
  });

  // Pending key requests count
  const { data: pendingKeyRequests = 0 } = useQuery({
    queryKey: ['officer-pending-key-requests'],
    queryFn: async () => {
      const { count } = await supabase
        .from('key_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      return count || 0;
    },
    refetchInterval: QUERY_CONFIG.refetch.realtime,
  });

  // Today's activity
  const { data: todayActivity } = useQuery({
    queryKey: ['officer-today-activity', todayIso],
    queryFn: async () => {
      const { count: outToday } = await supabase
        .from('key_assignments')
        .select('*', { count: 'exact', head: true })
        .gte('assigned_at', todayIso);
      const { count: returnedToday } = await supabase
        .from('key_assignments')
        .select('*', { count: 'exact', head: true })
        .gte('returned_at', todayIso);
      return { outToday: outToday || 0, returnedToday: returnedToday || 0 };
    },
    refetchInterval: QUERY_CONFIG.refetch.realtime,
  });

  // Active assignments
  const { data: activeAssignments = [] } = useQuery({
    queryKey: ['officer-active-assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('key_assignments')
        .select(`
          id, assigned_at, key_id, occupant_id,
          profiles:occupant_id (first_name, last_name),
          rooms:room_id (room_number)
        `)
        .is('returned_at', null)
        .order('assigned_at', { ascending: false })
        .limit(LIMITS.courtRecentActivity);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: QUERY_CONFIG.refetch.realtime,
    enabled: assignmentTab === 'active',
  });

  // Recent returns
  const { data: recentReturns = [] } = useQuery({
    queryKey: ['officer-recent-returns'],
    queryFn: async () => {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('key_assignments')
        .select(`
          id, assigned_at, returned_at, key_id, occupant_id,
          profiles:occupant_id (first_name, last_name),
          rooms:room_id (room_number)
        `)
        .not('returned_at', 'is', null)
        .gte('returned_at', since)
        .order('returned_at', { ascending: false })
        .limit(LIMITS.courtRecentActivity);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: QUERY_CONFIG.refetch.realtime,
    enabled: assignmentTab === 'recent',
  });

  // My reported issues
  const { data: myIssues = [] } = useQuery({
    queryKey: ['officer-my-issues', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('issues')
        .select('id, title, status, priority, created_at, rooms:room_id (room_number)')
        .or(`reported_by.eq.${user.id},created_by.eq.${user.id}`)
        .neq('status', 'resolved')
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    refetchInterval: QUERY_CONFIG.refetch.realtime,
  });

  const stats = keyStats || { total: 0, checkedOut: 0, available: 0 };
  const activity = todayActivity || { outToday: 0, returnedToday: 0 };
  const showRecent = assignmentTab === 'recent';
  const rows: any[] = showRecent ? recentReturns : activeAssignments;

  const statusTone = (s?: string) => {
    switch (s) {
      case 'open': return 'critical';
      case 'in_progress': return 'warning';
      default: return 'info';
    }
  };

  return (
    <div className="space-y-5 pb-20 px-3 sm:px-0">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 pt-2">
        <CompactHeader
          firstName={firstName}
          lastName={lastName}
          title={(profile as any)?.title || personnelInfo?.title || 'Court Officer'}
          department={(profile as any)?.department || (personnelInfo as any)?.department}
          roomNumber={(profile as any)?.room_number || personnelInfo?.roomNumber}
          avatarUrl={profile?.avatar_url}
          role="Court Officer"
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

      {/* Key stat strip — 4 cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatusCard
          title="Total Keys"
          value={stats.total}
          icon={Key}
          statusVariant="info"
          onClick={() => navigate('/keys')}
        />
        <StatusCard
          title="Checked Out"
          value={stats.checkedOut}
          icon={KeyRound}
          statusVariant={stats.checkedOut > 0 ? 'warning' : 'none'}
          onClick={() => navigate('/keys')}
        />
        <StatusCard
          title="Available"
          value={stats.available}
          icon={Shield}
          statusVariant={stats.available < 5 ? 'critical' : 'operational'}
          onClick={() => navigate('/keys')}
        />
        <StatusCard
          title="Pending Requests"
          value={pendingKeyRequests}
          icon={Clock}
          statusVariant={pendingKeyRequests > 0 ? 'warning' : 'none'}
          onClick={() => navigate('/admin/key-requests')}
        />
      </div>

      {/* Today's activity strip */}
      <Card>
        <CardContent className="p-3 sm:p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            Today
          </div>
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2">
              <ArrowUpFromLine className="h-4 w-4 text-[hsl(var(--status-warning))]" />
              <span className="text-sm">
                <span className="font-semibold text-foreground">{activity.outToday}</span>
                <span className="text-muted-foreground ml-1">checked out</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ArrowDownToLine className="h-4 w-4 text-[hsl(var(--status-operational))]" />
              <span className="text-sm">
                <span className="font-semibold text-foreground">{activity.returnedToday}</span>
                <span className="text-muted-foreground ml-1">returned</span>
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6">
        {/* Left column */}
        <div className="lg:col-span-3 space-y-4">
          {/* Assignments card with Active / Recent toggle */}
          <Card>
            <CardHeader className="pb-2 px-4 pt-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <KeyRound className="h-4 w-4" />
                  Key Assignments
                </CardTitle>
                <div className="flex items-center gap-1">
                  <div className="inline-flex rounded-md border border-border p-0.5">
                    <button
                      type="button"
                      onClick={() => setAssignmentTab('active')}
                      className={`px-2.5 py-1 text-xs rounded ${
                        !showRecent ? 'bg-muted text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      Active
                    </button>
                    <button
                      type="button"
                      onClick={() => setAssignmentTab('recent')}
                      className={`px-2.5 py-1 text-xs rounded ${
                        showRecent ? 'bg-muted text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      Recent Returns
                    </button>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/keys')} className="h-7 text-xs">
                    Manage <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {rows.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  {showRecent ? 'No keys returned in the last 24 hours.' : 'No keys currently checked out.'}
                </p>
              ) : (
                <div className="space-y-1.5">
                  <div className="hidden sm:grid grid-cols-[1fr_auto_auto] gap-3 px-2.5 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <span>Person</span>
                    <span className="w-20 text-center">Room</span>
                    <span className="w-24 text-right">{showRecent ? 'Returned' : 'Duration'}</span>
                  </div>
                  {rows.map((assignment: any) => {
                    const name = assignment.profiles
                      ? `${assignment.profiles.first_name || ''} ${assignment.profiles.last_name || ''}`.trim()
                      : 'Unknown';
                    const room = assignment.rooms?.room_number || '—';
                    const refTime = showRecent ? assignment.returned_at : assignment.assigned_at;
                    const elapsed = refTime
                      ? formatDistanceToNow(new Date(refTime), { addSuffix: showRecent })
                      : '—';

                    return (
                      <div
                        key={assignment.id}
                        className="p-2.5 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                      >
                        <div className="hidden sm:grid grid-cols-[1fr_auto_auto] gap-3 items-center">
                          <div className="flex items-center gap-2 min-w-0">
                            <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm truncate text-foreground">{name}</span>
                          </div>
                          <Badge variant="outline" className="text-xs w-20 justify-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {room}
                          </Badge>
                          <span className="text-xs text-muted-foreground w-24 text-right">{elapsed}</span>
                        </div>
                        <div className="sm:hidden">
                          <div className="flex items-center gap-2">
                            <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm truncate text-foreground">{name}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 ml-5 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {room}
                            </span>
                            <span>·</span>
                            <span>{elapsed}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* My reported issues */}
          <Card>
            <CardHeader className="pb-2 px-4 pt-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  My Reported Issues
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate('/my-issues')} className="h-7 text-xs">
                  Report Issue <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {myIssues.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  No open issues you've reported.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {myIssues.map((issue: any) => {
                    const tone = statusTone(issue.status);
                    const room = issue.rooms?.room_number;
                    return (
                      <button
                        key={issue.id}
                        type="button"
                        onClick={() => navigate('/my-issues')}
                        className="w-full text-left p-2.5 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-foreground truncate">{issue.title}</p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              {room && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {room}
                                </span>
                              )}
                              {room && <span>·</span>}
                              <span>{formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}</span>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className="text-[10px] uppercase tracking-wider flex-shrink-0"
                            style={{
                              color: `hsl(var(--status-${tone}))`,
                              borderColor: `hsl(var(--status-${tone}) / 0.3)`,
                              background: `hsl(var(--status-${tone}) / 0.1)`,
                            }}
                          >
                            {String(issue.status || '').replace('_', ' ')}
                          </Badge>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-2 px-4 pt-4">
              <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              <Button
                variant="default"
                className="w-full justify-start h-11"
                onClick={() => navigate('/keys')}
              >
                <Key className="h-4 w-4 mr-2" />
                Key Management
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start h-11"
                onClick={() => navigate('/spaces')}
              >
                <Building2 className="h-4 w-4 mr-2" />
                Building Layout
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start h-11"
                onClick={() => navigate('/term-sheet')}
              >
                <Scale className="h-4 w-4 mr-2" />
                Term Sheet
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start h-11"
                onClick={() => navigate('/my-issues')}
              >
                <Wrench className="h-4 w-4 mr-2" />
                Report an Issue
              </Button>
            </CardContent>
          </Card>

          <TermSheetPreview maxItems={5} defaultExpanded={false} />
        </div>
      </div>
    </div>
  );
}
