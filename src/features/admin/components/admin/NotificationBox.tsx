import { useState } from "react";
import { logger } from '@/lib/logger';
import { Bell, Key, AlertTriangle, Wrench, Package, AlertCircle, Gavel, CheckCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import { useAdminNotifications, useMarkNotificationRead, type AdminNotification } from "@features/admin/hooks/useAdminNotifications";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@features/auth/hooks/useAuth";
import { useNotifications, type Notification as PersonalNotification } from "@shared/hooks/useNotifications";
import { supabase } from "@/lib/supabase";

const notificationIcons = {
  new_supply_request: Package,
  new_issue: AlertTriangle,
  issue_status_change: AlertCircle,
  new_key_order: Key,
  supply_request: Package,
  issue: AlertTriangle,
  maintenance: Wrench,
  user_approved: AlertCircle,
  user_rejected: AlertCircle,
  role_assigned: AlertCircle,
  role_changed: AlertCircle,
  role_removed: AlertCircle,
  new_user_pending: AlertCircle,
  court_assignment_change: Gavel,
};

const personalNotificationIcons: Record<PersonalNotification['type'], typeof Bell> = {
  issue_update: AlertCircle,
  new_assignment: Bell,
  maintenance: Wrench,
  key_request_approved: Key,
  key_request_denied: Key,
  key_request_fulfilled: Key,
  staff_task_pending: Bell,
  staff_task_update: Bell,
};

function isSafeInternalPath(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//');
}

function getPersonalRoute(n: PersonalNotification): string | null {
  if (isSafeInternalPath(n.action_url)) return n.action_url;
  const metaUrl = (n.metadata as { action_url?: unknown })?.action_url;
  if (isSafeInternalPath(metaUrl)) return metaUrl;
  switch (n.type) {
    case 'issue_update':
      return '/operations?tab=issues';
    case 'new_assignment':
    case 'staff_task_pending':
    case 'staff_task_update':
      return '/tasks';
    case 'maintenance':
      return '/operations?tab=maintenance';
    case 'key_request_approved':
    case 'key_request_denied':
    case 'key_request_fulfilled':
      return '/my-activity?tab=keys';
    default:
      return null;
  }
}

/**
 * The one notification bell for admins: system-wide alerts (admin_notifications)
 * and personal notifications (user_notifications, e.g. room assignments, key
 * request updates) merged into a single chronological list, with one combined
 * unread badge and one "Mark all read" / "Clear all" pair — deliberately one
 * icon, not two separate bells, so it stays a single clean affordance.
 */
export const NotificationBox = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [recentlyRead, setRecentlyRead] = useState<Set<string>>(() => new Set());

  // Admin-wide alerts
  const { data: notifications, isLoading } = useAdminNotifications();
  const markAsReadMutation = useMarkNotificationRead();

  // Personal notifications (same table/hook that drives the taskbar badge)
  const {
    notifications: personalNotifications,
    unreadCount: personalUnreadCount,
    markAsRead: markPersonalRead,
    markAllAsRead: markAllPersonalRead,
    clearAllNotifications: clearAllPersonal,
    isLoading: isPersonalLoading,
  } = useNotifications(user?.id);

  // Real-time notifications are set up at app level via useConditionalNotifications

  // Last seen tracking to distinguish "New" vs previously seen
  const [lastSeenAt, setLastSeenAt] = useState<string>(() => {
    try { return localStorage.getItem('admin.notifications.lastSeen') || ''; } catch { return ''; }
  });

  // Retention window and hiding expired notifications client-side
  const RETENTION_DAYS = 30; // adjust as desired
  const now = new Date();
  const cutoffIso = new Date(now.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const nowIso = now.toISOString();
  const visibleNotifications = (notifications || []).filter((n: AdminNotification) => {
    const withinRetention = !n.created_at || n.created_at >= cutoffIso;
    const notExpired = !n.expires_at || n.expires_at > nowIso;
    return withinRetention && notExpired;
  });
  const isServerUnread = (n: AdminNotification) => !n.read_by || n.read_by.length === 0;
  const isEffectivelyUnread = (n: AdminNotification) => isServerUnread(n) && !recentlyRead.has(n.id);
  const isNewSinceSeen = (createdAt: string) => !!lastSeenAt && createdAt > lastSeenAt;

  const adminUnreadNewCount = visibleNotifications.filter(n => isEffectivelyUnread(n) && isNewSinceSeen(n.created_at)).length;
  const personalUnreadNewCount = personalNotifications.filter(n => !n.read && isNewSinceSeen(n.created_at)).length;
  const rawUnreadNewCount = adminUnreadNewCount + personalUnreadNewCount;
  const unreadCount = isOpen ? 0 : rawUnreadNewCount; // show badge only for NEW unread

  // Critical courtroom issues (from admin notifications and live court issues)
  const criticalIssueUnreadCount = visibleNotifications?.filter(n =>
    isEffectivelyUnread(n) && isNewSinceSeen(n.created_at) &&
    (["new_issue", "issue_status_change", "issue"].includes(n.notification_type)) &&
    (["high", "urgent", "critical"].includes((n.urgency || "").toLowerCase()))
  ).length || 0;

  // Only pulse and show red tint when there are UNREAD critical notifications
  const showCriticalPulse = criticalIssueUnreadCount > 0;
  const criticalCount = criticalIssueUnreadCount; // numeric badge shows unread critical only

  // Count of items outside retention or expired (purged automatically on open)
  const oldOrExpiredCount = (notifications || []).filter((n: AdminNotification) => (n.created_at && n.created_at < cutoffIso) || (n.expires_at && n.expires_at <= nowIso)).length;

  const purgeOldNotifications = async () => {
    if (oldOrExpiredCount === 0) return;
    try {
      // Delete by retention first
      const { error: delOldErr } = await supabase
        .from('admin_notifications')
        .delete()
        .lt('created_at', cutoffIso);
      if (delOldErr) throw delOldErr;

      // Delete by expiry
      const { error: delExpErr } = await supabase
        .from('admin_notifications')
        .delete()
        .lte('expires_at', nowIso);
      if (delExpErr) throw delExpErr;

      // Refresh queries so UI updates immediately
      queryClient.invalidateQueries({ queryKey: ['adminNotifications'] });
    } catch (error) {
      logger.error('NotificationBox: purgeOldNotifications failed', error);
    }
  };

  const handleAdminClick = (notification: AdminNotification) => {
    setIsOpen(false);
    markAsReadMutation.mutate(notification.id);
    const actionUrl = (notification.metadata as { action_url?: unknown })?.action_url;
    if (isSafeInternalPath(actionUrl)) {
      navigate(actionUrl);
      return;
    }
    switch (notification.notification_type) {
      case 'new_supply_request':
        navigate('/admin/supply-requests');
        break;
      case 'new_issue':
      case 'issue_status_change':
        navigate(
          notification.related_table === 'issues' && notification.related_id
            ? `/operations?tab=issues&issue_id=${notification.related_id}`
            : '/operations?tab=issues'
        );
        break;
      case 'new_key_order':
        navigate('/keys');
        break;
      case 'new_user_pending':
        navigate('/admin');
        break;
      case 'user_approved':
      case 'user_rejected':
      case 'role_assigned':
      case 'role_changed':
      case 'role_removed':
        navigate('/admin');
        break;
      case 'court_assignment_change':
        navigate('/term-sheet');
        break;
      default:
        navigate('/admin');
    }
  };

  const handlePersonalClick = (n: PersonalNotification) => {
    setIsOpen(false);
    if (!n.read) markPersonalRead(n.id);
    const route = getPersonalRoute(n);
    if (route) navigate(route);
  };

  const handleMarkAllRead = () => {
    visibleNotifications?.forEach((n) => {
      if (isServerUnread(n)) {
        setRecentlyRead(prev => new Set(prev).add(n.id));
        markAsReadMutation.mutate(n.id);
      }
    });
    if (personalUnreadCount > 0) markAllPersonalRead();
  };

  const handleClearAll = async () => {
    try {
      if (visibleNotifications.length > 0) {
        const ids = visibleNotifications.map(n => n.id);
        const { error } = await supabase.from('admin_notifications').delete().in('id', ids);
        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ['adminNotifications'] });
      }
      if (personalNotifications.length > 0) {
        await clearAllPersonal();
      }
    } catch (error) {
      logger.error('NotificationBox: clearAll failed', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    return notificationIcons[type as keyof typeof notificationIcons] || Bell;
  };

  const getNotificationColor = (type: string, urgency: string) => {
    const u = (urgency || '').toLowerCase();
    if (['high', 'urgent', 'critical'].includes(u)) {
      return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 dark:bg-red-900/20 dark:text-red-400';
    }

    switch (type) {
      case 'new_key_order':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 dark:bg-blue-900/20 dark:text-blue-400';
      case 'new_supply_request':
        return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 dark:bg-green-900/20 dark:text-green-400';
      case 'new_issue':
      case 'issue_status_change':
        return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 dark:bg-red-900/20 dark:text-red-400';
      case 'court_assignment_change':
        return 'bg-slate-100 dark:bg-slate-900/30 text-slate-600 dark:text-slate-400 dark:bg-slate-900/20 dark:text-slate-400';
      default:
        return 'bg-gray-100 dark:bg-gray-800/30 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  // Merge both streams into one chronological list — one bell, one feed.
  interface CombinedEntry {
    key: string;
    created_at: string;
    isUnread: boolean;
    isNew: boolean;
    urgency: string;
    icon: typeof Bell;
    color: string;
    title: string;
    message: string;
    onClick: () => void;
  }
  const combined: CombinedEntry[] = [
    ...visibleNotifications.map((n): CombinedEntry => ({
      key: `admin-${n.id}`,
      created_at: n.created_at,
      isUnread: isEffectivelyUnread(n),
      isNew: isNewSinceSeen(n.created_at),
      urgency: n.urgency,
      icon: getNotificationIcon(n.notification_type),
      color: getNotificationColor(n.notification_type, n.urgency),
      title: n.title,
      message: n.message,
      onClick: () => handleAdminClick(n),
    })),
    ...personalNotifications.map((n): CombinedEntry => ({
      key: `personal-${n.id}`,
      created_at: n.created_at,
      isUnread: !n.read,
      isNew: isNewSinceSeen(n.created_at),
      urgency: n.urgency || '',
      icon: personalNotificationIcons[n.type] || Bell,
      color: 'bg-gray-100 dark:bg-gray-800/30 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400',
      title: n.title,
      message: n.message,
      onClick: () => handlePersonalClick(n),
    })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <Popover
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (open) {
          const now = new Date().toISOString();
          try { localStorage.setItem('admin.notifications.lastSeen', now); } catch {}
          setLastSeenAt(now);
          // Auto-mark visible notifications as read on open to clear the red badge immediately
          visibleNotifications?.forEach((n) => {
            if (isServerUnread(n)) {
              setRecentlyRead(prev => new Set(prev).add(n.id));
              markAsReadMutation.mutate(n.id);
            }
          });
          if (personalUnreadCount > 0) markAllPersonalRead();
          // Soft-clean old/expired items in background
          purgeOldNotifications();
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative"
          aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        >
          <Bell className={`h-5 w-5 ${(unreadCount > 0 || showCriticalPulse) ? 'text-red-600 dark:text-red-400' : ''}`} />
          {showCriticalPulse && (
            <>
              <span className="pointer-events-none absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500/70 opacity-75 animate-ping" />
              <span className="pointer-events-none absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500/40" />
            </>
          )}
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 z-10 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
          {criticalIssueUnreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -left-1 z-10 h-4 min-w-4 px-1 rounded-full p-0 flex items-center justify-center text-[10px]"
            >
              {criticalCount > 99 ? '99+' : criticalCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            <div className="flex items-center gap-1">
              {rawUnreadNewCount > 0 && (
                <Button variant="ghost" size="sm" onClick={handleMarkAllRead} title="Mark all read">
                  <CheckCheck className="h-4 w-4 mr-1" />
                  Mark all read
                </Button>
              )}
              {combined.length > 0 && (
                <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={handleClearAll} title="Clear all">
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear all
                </Button>
              )}
            </div>
          </div>
        </div>

        <ScrollArea className="h-96">
          {(isLoading || isPersonalLoading) ? (
            <div className="p-4 text-center text-muted-foreground">
              <div className="animate-pulse">Loading notifications...</div>
            </div>
          ) : combined.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No new notifications</p>
            </div>
          ) : (
            <div className="p-2">
              {combined.map((entry) => {
                const Icon = entry.icon;
                return (
                  <Card
                    key={entry.key}
                    className={`mb-2 cursor-pointer transition-colors hover:bg-muted ${
                      entry.isUnread ? 'border-primary bg-primary/5' : 'border-muted'
                    } ${entry.isNew ? 'ring-1 ring-primary/50' : ''}`}
                    onClick={entry.onClick}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-full ${entry.color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm">{entry.title}</p>
                            <div className="flex items-center gap-1">
                              {entry.isNew && (
                                <Badge variant="secondary" className="text-[10px]">New</Badge>
                              )}
                              {entry.urgency === 'high' && (
                                <Badge variant="destructive" className="text-xs">
                                  {entry.urgency.toUpperCase()}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {entry.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatTimeAgo(entry.created_at)}
                          </p>
                        </div>
                        {entry.isUnread && (
                          <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
