import { useState, useEffect } from "react";
import { logger } from '@/lib/logger';
import { Bell, Key, AlertTriangle, Wrench, Package, AlertCircle, Gavel } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import { useAdminNotifications, useMarkNotificationRead } from "@/hooks/useAdminNotifications";
import { useQueryClient } from "@tanstack/react-query";
import { useCourtIssuesIntegration } from "@/hooks/useCourtIssuesIntegration";
import { supabase } from "@/lib/supabase";

const notificationIcons = {
  new_key_request: Key,
  new_supply_request: Package,
  new_issue: AlertTriangle,
  issue_status_change: AlertCircle,
  new_key_order: Key,
  key_request: Key,
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

export const NotificationBox = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [recentlyRead, setRecentlyRead] = useState<Set<string>>(() => new Set());
  
  // Use the admin notifications hooks
  const { data: notifications, isLoading } = useAdminNotifications();
  const markAsReadMutation = useMarkNotificationRead();
  
  // Real-time notifications are set up at app level via useConditionalNotifications
  // Court issues summary for distinct critical indicator
  const { courtIssues } = useCourtIssuesIntegration();
  const openHighSeverityIssues = (courtIssues || []).filter(i =>
    ['critical', 'urgent', 'high'].includes((i.priority || '').toLowerCase())
  ).length;
  
  // Last seen tracking to distinguish "New" vs previously seen
  const [lastSeenAt, setLastSeenAt] = useState<string>(() => {
    try { return localStorage.getItem('admin.notifications.lastSeen') || ''; } catch { return ''; }
  });

  // Retention window and hiding expired notifications client-side
  const RETENTION_DAYS = 30; // adjust as desired
  const now = new Date();
  const cutoffIso = new Date(now.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const nowIso = now.toISOString();
  const visibleNotifications = (notifications || []).filter((n: Record<string, unknown>) => {
    const withinRetention = !n.created_at || n.created_at >= cutoffIso;
    const notExpired = !n.expires_at || n.expires_at > nowIso;
    return withinRetention && notExpired;
  });
  const isServerUnread = (n: Record<string, unknown>) => !n.read_by || n.read_by.length === 0;
  const isEffectivelyUnread = (n: Record<string, unknown>) => isServerUnread(n) && !recentlyRead.has(n.id);
  const isNewSinceSeen = (n: Record<string, unknown>) => !!lastSeenAt && n.created_at > lastSeenAt;
  const rawUnreadNewCount = visibleNotifications.filter(n => isEffectivelyUnread(n) && isNewSinceSeen(n)).length || 0;
  const unreadCount = isOpen ? 0 : rawUnreadNewCount; // show badge only for NEW unread

  // Critical courtroom issues (from admin notifications and live court issues)
  const criticalIssueUnreadCount = visibleNotifications?.filter(n =>
    isEffectivelyUnread(n) && isNewSinceSeen(n) &&
    (["new_issue", "issue_status_change", "issue"].includes(n.notification_type)) &&
    (["high", "urgent", "critical"].includes((n.urgency || "").toLowerCase()))
  ).length || 0;

  // Only pulse and show red tint when there are UNREAD critical notifications
  const showCriticalPulse = criticalIssueUnreadCount > 0;
  const criticalCount = criticalIssueUnreadCount; // numeric badge shows unread critical only

  // Count of items outside retention or expired (for optional purge UX)
  const oldOrExpiredCount = (notifications || []).filter((n: Record<string, unknown>) => (n.created_at && n.created_at < cutoffIso) || (n.expires_at && n.expires_at <= nowIso)).length;

  const purgeOldNotifications = async () => {
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
    } catch (e) {
      logger.error('NotificationBox: purgeOldNotifications failed', e);
    }
  };

  const handleNotificationClick = (notification: Record<string, unknown>) => {
    setIsOpen(false);
    
    // Mark notification as read
    markAsReadMutation.mutate(notification.id);
    
    // Prefer deep link if provided
    const actionUrl = (notification as Record<string, unknown>)?.metadata?.action_url as string | undefined;
    if (actionUrl) {
      navigate(actionUrl);
      return;
    }
    // Navigate based on notification type
    switch (notification.notification_type) {
      case 'new_key_request':
        navigate('/admin/key-requests');
        break;
      case 'new_supply_request':
        navigate('/admin/supply-requests');
        break;
      case 'new_issue':
      case 'issue_status_change':
        navigate('/admin/issues');
        break;
      case 'new_key_order':
        navigate('/admin/key-orders');
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
        navigate('/court-operations');
        break;
      default:
        navigate('/admin');
    }
  };

  const clearAllNotifications = () => {
    // Mark all notifications as read
    visibleNotifications?.forEach(notification => {
      if (!notification.read_by || notification.read_by.length === 0) {
        markAsReadMutation.mutate(notification.id);
      }
    });
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
      case 'new_key_request':
      case 'new_key_order':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 dark:bg-blue-900/20 dark:text-blue-400';
      case 'new_supply_request':
        return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 dark:bg-green-900/20 dark:text-green-400';
      case 'new_issue':
      case 'issue_status_change':
        return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 dark:bg-red-900/20 dark:text-red-400';
      case 'court_assignment_change':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 dark:bg-purple-900/20 dark:text-purple-400';
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
              setRecentlyRead(prev => {
                const next = new Set(prev);
                next.add(n.id);
                return next;
              });
              markAsReadMutation.mutate(n.id);
            }
          });
          // Soft-clean old/expired items in background
          purgeOldNotifications();
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
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
            <h3 className="font-semibold">Admin Notifications</h3>
            <div className="flex items-center gap-2">
              {oldOrExpiredCount > 0 && (
                <Button variant="ghost" size="sm" onClick={purgeOldNotifications} title="Remove old notifications">
                  Clear Old
                </Button>
              )}
              {visibleNotifications.length > 0 && rawUnreadNewCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearAllNotifications}>
                  Mark All Read
                </Button>
              )}
            </div>
          </div>
        </div>
        
        <ScrollArea className="h-96">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              <div className="animate-pulse">Loading notifications...</div>
            </div>
          ) : visibleNotifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No new notifications</p>
            </div>
          ) : (
            <div className="p-2">
              {visibleNotifications.map((notification) => {
                const Icon = getNotificationIcon(notification.notification_type);
                const isRead = !isEffectivelyUnread(notification);
                const isNewSinceSeen = lastSeenAt && notification.created_at > lastSeenAt;
                
                return (
                  <Card 
                    key={notification.id}
                    className={`mb-2 cursor-pointer transition-colors hover:bg-muted ${
                      !isRead ? 'border-primary bg-primary/5' : 'border-muted'
                    } ${isNewSinceSeen ? 'ring-1 ring-primary/50' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-full ${getNotificationColor(notification.notification_type, notification.urgency)}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm">{notification.title}</p>
                            <div className="flex items-center gap-1">
                              {isNewSinceSeen && (
                                <Badge variant="secondary" className="text-[10px]">New</Badge>
                              )}
                              {notification.urgency === 'high' && (
                              <Badge variant="destructive" className="text-xs">
                                {notification.urgency.toUpperCase()}
                              </Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatTimeAgo(notification.created_at)}
                          </p>
                        </div>
                        {!isRead && (
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