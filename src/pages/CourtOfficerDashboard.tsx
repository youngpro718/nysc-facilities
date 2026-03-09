/**
 * Court Officer Dashboard — Security Hub
 * 
 * Purpose-built for Court Officers focused on:
 * - Key management and status
 * - Active key assignments
 * - Building security overview
 */

import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationDropdown } from '@/components/user/NotificationDropdown';
import { CompactHeader } from '@/components/user/CompactHeader';
import { TermSheetPreview } from '@/components/user/TermSheetPreview';
import { StatusCard } from '@/components/ui/StatusCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserPersonnelInfo } from '@/hooks/user/useUserPersonnelInfo';
import { formatDistanceToNow } from 'date-fns';
import {
  Key, KeyRound, Lock, ArrowRight,
  Shield, Building2, Scale, User, Clock, MapPin
} from 'lucide-react';

export default function CourtOfficerDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { data: personnelInfo } = useUserPersonnelInfo(user?.id);

  const firstName = profile?.first_name || user?.user_metadata?.first_name || 'there';
  const lastName = profile?.last_name || user?.user_metadata?.last_name || '';

  const {
    notifications = [],
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
  } = useNotifications(user?.id);

  // Key stats
  const { data: keyStats } = useQuery({
    queryKey: ['officer-key-stats'],
    queryFn: async () => {
      // Total keys
      const { count: totalKeys } = await supabase
        .from('key_assignments')
        .select('*', { count: 'exact', head: true });

      // Checked out (no return date)
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
    refetchInterval: 30000,
  });

  // Active key assignments (checked out, not returned)
  const { data: activeAssignments = [] } = useQuery({
    queryKey: ['officer-active-assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('key_assignments')
        .select(`
          id,
          assigned_at,
          key_id,
          occupant_id,
          profiles:occupant_id (first_name, last_name),
          rooms:room_id (room_number)
        `)
        .is('returned_at', null)
        .order('assigned_at', { ascending: false })
        .limit(8);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000,
  });

  // Pending key requests
  const { data: pendingKeyRequests } = useQuery({
    queryKey: ['officer-pending-key-requests'],
    queryFn: async () => {
      const { count } = await supabase
        .from('key_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      return count || 0;
    },
    refetchInterval: 30000,
  });

  const stats = keyStats || { total: 0, checkedOut: 0, available: 0 };

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

      {/* Key Status Strip */}
      <div className="grid grid-cols-3 gap-3">
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
      </div>

      {/* Pending Requests Alert */}
      {(pendingKeyRequests ?? 0) > 0 && (
        <Card
          className="border-l-[3px] border-l-[hsl(var(--status-warning))] cursor-pointer hover:bg-card-hover transition-colors"
          onClick={() => navigate('/admin/key-requests')}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[hsl(var(--status-warning)/0.1)]">
                <Clock className="h-4 w-4 text-[hsl(var(--status-warning))]" />
              </div>
              <div>
                <p className="text-sm font-medium">{pendingKeyRequests} Pending Key Request{pendingKeyRequests !== 1 ? 's' : ''}</p>
                <p className="text-xs text-muted-foreground">Awaiting approval</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6">
        {/* Left: Active Key Assignments — wider */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="pb-2 px-4 pt-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <KeyRound className="h-4 w-4" />
                  Active Key Assignments
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate('/keys')} className="h-7 text-xs">
                  Manage Keys <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {activeAssignments.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">No keys currently checked out</p>
              ) : (
                <div className="space-y-1.5">
                  {/* Table header — hidden on mobile */}
                  <div className="hidden sm:grid grid-cols-[1fr_auto_auto] gap-3 px-2.5 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <span>Person</span>
                    <span className="w-20 text-center">Room</span>
                    <span className="w-24 text-right">Duration</span>
                  </div>
                  {activeAssignments.map((assignment: any) => {
                    const name = assignment.profiles
                      ? `${assignment.profiles.first_name || ''} ${assignment.profiles.last_name || ''}`.trim()
                      : 'Unknown';
                    const room = assignment.rooms?.room_number || '—';
                    const elapsed = assignment.assigned_at
                      ? formatDistanceToNow(new Date(assignment.assigned_at), { addSuffix: false })
                      : '—';

                    return (
                      <div
                        key={assignment.id}
                        className="p-2.5 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                      >
                        {/* Desktop: grid row */}
                        <div className="hidden sm:grid grid-cols-[1fr_auto_auto] gap-3 items-center">
                          <div className="flex items-center gap-2 min-w-0">
                            <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm truncate">{name}</span>
                          </div>
                          <Badge variant="outline" className="text-xs w-20 justify-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {room}
                          </Badge>
                          <span className="text-xs text-muted-foreground w-24 text-right">{elapsed}</span>
                        </div>
                        {/* Mobile: stacked layout */}
                        <div className="sm:hidden">
                          <div className="flex items-center gap-2">
                            <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm truncate">{name}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 ml-5.5 text-xs text-muted-foreground">
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
        </div>

        {/* Right: Quick Actions + Term Preview */}
        <div className="lg:col-span-2 space-y-4">
          {/* Quick Actions */}
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
            </CardContent>
          </Card>

          {/* Term Sheet Preview */}
          <TermSheetPreview maxItems={5} defaultExpanded={false} />
        </div>
      </div>
    </div>
  );
}
