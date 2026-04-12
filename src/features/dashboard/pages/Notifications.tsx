import { NotificationBox } from "@features/admin/components/admin/NotificationBox";
import { useAuth } from "@features/auth/hooks/useAuth";
import { useNotifications } from "@shared/hooks/useNotifications";
import { useNavigate } from "react-router-dom";
import { Bell, Check, CheckCheck, Trash2, Inbox } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  urgency?: string;
  action_url?: string;
  metadata?: unknown;
  related_id?: string;
}

function getNotificationRoute(notification: Notification): string | null {
  if (notification.action_url) return notification.action_url;
  if ((notification.metadata as any)?.action_url) return (notification.metadata as any).action_url;

  switch (notification.type) {
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

function UserNotifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    clearNotification, 
    clearAllNotifications,
    isLoading 
  } = useNotifications(user?.id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (notifications.length === 0) {
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

  return (
    <div className="space-y-3">
      {/* Actions bar */}
      {unreadCount > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{unreadCount}</span> unread
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              <CheckCheck className="h-4 w-4 mr-1" />
              Mark all read
            </Button>
            <Button variant="ghost" size="sm" onClick={clearAllNotifications} className="text-muted-foreground">
              <Trash2 className="h-4 w-4 mr-1" />
              Clear all
            </Button>
          </div>
        </div>
      )}

      <ScrollArea className="max-h-[70dvh]">
        <div className="space-y-2">
          {notifications.map((n) => {
            const route = getNotificationRoute(n as Notification);
            return (
            <Card
              key={n.id}
              className={cn(
                "transition-colors",
                !n.read && "border-primary/30 bg-primary/5",
                route && "cursor-pointer hover:bg-accent/50"
              )}
              onClick={() => {
                if (route) {
                  markAsRead(n.id);
                  navigate(route);
                }
              }}
            >
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="text-sm font-medium truncate">{n.title}</h4>
                      {!n.read && (
                        <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!n.read && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }}>
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={(e) => { e.stopPropagation(); clearNotification(n.id); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
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

export default function Notifications() {
  const { isAdmin } = useAuth();

  return (
    <div className="space-y-4 sm:space-y-6">
      {isAdmin ? <NotificationBox /> : <UserNotifications />}
    </div>
  );
}
