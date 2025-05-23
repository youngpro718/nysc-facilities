import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, Clock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";

export interface Notification {
  id: string;
  type: 'issue_update' | 'new_assignment' | 'maintenance';
  title: string;
  message: string;
  created_at: string;
  read: boolean;
  metadata?: Record<string, any>;
}

interface NotificationCardProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

export function NotificationCard({ notifications, onMarkAsRead, onMarkAllAsRead }: NotificationCardProps) {
  const unreadCount = notifications.filter(n => !n.read).length;
  const isMobile = useIsMobile();

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'issue_update':
        return <Bell className="h-4 w-4 text-blue-500" />;
      case 'new_assignment':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'maintenance':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <Card className="h-full">
      <div className={cn(
        "flex items-center justify-between",
        "p-4 sm:p-6",
        "border-b"
      )}>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg sm:text-2xl font-semibold">Notifications</h2>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Badge variant="secondary" className="font-normal">
              {unreadCount} unread
            </Badge>
          )}
          <Button 
            variant="outline" 
            size={isMobile ? "sm" : "default"}
            onClick={onMarkAllAsRead}
            disabled={unreadCount === 0}
            className="whitespace-nowrap"
          >
            {isMobile ? "Mark all" : "Mark all as read"}
          </Button>
        </div>
      </div>
      
      <ScrollArea className={cn(
        "h-[300px] sm:h-[400px]",
        "px-4 sm:px-6"
      )}>
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
            <Bell className="h-8 w-8" />
            <p>No notifications</p>
          </div>
        ) : (
          <div className="space-y-2 py-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "group relative rounded-lg border p-3 sm:p-4",
                  "transition-colors hover:bg-accent",
                  !notification.read ? 'bg-muted/50' : '',
                  "cursor-pointer"
                )}
                onClick={() => !notification.read && onMarkAsRead(notification.id)}
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="mt-1 shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{notification.title}</p>
                      {!notification.read && (
                        <Badge variant="default" className="text-[10px] shrink-0">New</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 sm:line-clamp-none">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(notification.created_at), isMobile ? "MMM d, h:mm a" : "PPp")}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </Card>
  );
} 