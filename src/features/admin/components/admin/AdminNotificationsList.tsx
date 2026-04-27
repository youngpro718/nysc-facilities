import { useNavigate } from "react-router-dom";
import { useAdminNotifications, useMarkNotificationRead } from "@features/admin/hooks/useAdminNotifications";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { CheckCheck, Trash2, Inbox, Bell, Key, AlertTriangle, Wrench, Package, AlertCircle, Gavel } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { LoadingSkeleton } from "@shared/components/common/common/LoadingSkeleton";
import { useState } from "react";
import { logger } from "@/lib/logger";

const notificationIcons: Record<string, React.ComponentType<{ className?: string }>> = {
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

function getRoute(notification: any): string | null {
  const actionUrl = notification?.metadata?.action_url as string | undefined;
  if (actionUrl) return actionUrl;
  switch (notification.notification_type) {
    case 'new_key_request': return '/admin/key-requests';
    case 'new_supply_request': return '/admin/supply-requests';
    case 'new_issue':
    case 'issue_status_change': return '/admin/issues';
    case 'new_key_order': return '/admin/key-orders';
    case 'new_user_pending':
    case 'user_approved':
    case 'user_rejected':
    case 'role_assigned':
    case 'role_changed':
    case 'role_removed': return '/admin';
    case 'court_assignment_change': return '/court-operations';
    default: return null;
  }
}

export function AdminNotificationsList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: notifications = [], isLoading } = useAdminNotifications();
  const markAsRead = useMarkNotificationRead();
  const [busy, setBusy] = useState(false);

  // Filter out expired
  const now = new Date().toISOString();
  const visible = notifications.filter((n: any) => !n.expires_at || n.expires_at > now);
  const unread = visible.filter((n: any) => !n.read_by || n.read_by.length === 0);

  if (isLoading) {
    return <LoadingSkeleton type="card" count={4} />;
  }

  if (visible.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Inbox className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <h3 className="font-medium mb-1">No notifications</h3>
          <p className="text-sm text-muted-foreground">You're all caught up!</p>
        </CardContent>
      </Card>
    );
  }

  const markAllRead = async () => {
    setBusy(true);
    try {
      await Promise.all(unread.map((n: any) => markAsRead.mutateAsync(n.id)));
    } finally {
      setBusy(false);
    }
  };

  const clearAll = async () => {
    setBusy(true);
    try {
      const ids = visible.map((n: any) => n.id);
      const { error } = await supabase.from('admin_notifications').delete().in('id', ids);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['adminNotifications'] });
    } catch (e) {
      logger.error('clearAll admin notifications failed', e);
    } finally {
      setBusy(false);
    }
  };

  const clearOne = async (id: string) => {
    try {
      const { error } = await supabase.from('admin_notifications').delete().eq('id', id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['adminNotifications'] });
    } catch (e) {
      logger.error('clearOne admin notification failed', e);
    }
  };

  return (
    <div className="space-y-3">
      {unread.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{unread.length}</span> unread
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={markAllRead} disabled={busy}>
              <CheckCheck className="h-4 w-4 mr-1" />
              Mark all read
            </Button>
            <Button variant="ghost" size="sm" onClick={clearAll} disabled={busy} className="text-muted-foreground">
              <Trash2 className="h-4 w-4 mr-1" />
              Clear all
            </Button>
          </div>
        </div>
      )}

      <ScrollArea className="max-h-[70dvh]">
        <div className="space-y-2">
          {visible.map((n: any) => {
            const Icon = notificationIcons[n.notification_type] || Bell;
            const isUnread = !n.read_by || n.read_by.length === 0;
            const route = getRoute(n);
            const isCritical = ['high', 'urgent', 'critical'].includes((n.urgency || '').toLowerCase());

            return (
              <Card
                key={n.id}
                className={cn(
                  "transition-colors",
                  isUnread && "border-primary/30 bg-primary/5",
                  isCritical && "border-destructive/40",
                  route && "cursor-pointer hover:bg-accent/50"
                )}
                onClick={() => {
                  if (route) {
                    if (isUnread) markAsRead.mutate(n.id);
                    navigate(route);
                  }
                }}
              >
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "p-2 rounded-md shrink-0",
                      isCritical ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="text-sm font-medium truncate">{n.title}</h4>
                        {isCritical && <Badge variant="destructive" className="text-[10px] h-4 px-1.5">Critical</Badge>}
                        {isUnread && <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{n.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground shrink-0"
                      onClick={(e) => { e.stopPropagation(); clearOne(n.id); }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
