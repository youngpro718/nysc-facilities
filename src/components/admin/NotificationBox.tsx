import { useState, useEffect } from "react";
import { Bell, Key, AlertTriangle, Wrench, Package, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import { useAdminNotifications, useMarkNotificationRead } from "@/hooks/useAdminNotifications";
import { useAdminRealtimeNotifications } from "@/hooks/useAdminRealtimeNotifications";

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
};

export const NotificationBox = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  
  // Use the admin notifications hooks
  const { data: notifications, isLoading } = useAdminNotifications();
  const markAsReadMutation = useMarkNotificationRead();
  
  // Use real-time notifications for immediate toast alerts
  useAdminRealtimeNotifications();
  
  // Calculate unread count
  const unreadCount = notifications?.filter(n => 
    !n.read_by || n.read_by.length === 0
  ).length || 0;

  const handleNotificationClick = (notification: any) => {
    setIsOpen(false);
    
    // Mark notification as read
    markAsReadMutation.mutate(notification.id);
    
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
      default:
        navigate('/admin');
    }
  };

  const clearAllNotifications = () => {
    // Mark all notifications as read
    notifications?.forEach(notification => {
      if (!notification.read_by || notification.read_by.length === 0) {
        markAsReadMutation.mutate(notification.id);
      }
    });
  };

  const getNotificationIcon = (type: string) => {
    return notificationIcons[type as keyof typeof notificationIcons] || Bell;
  };

  const getNotificationColor = (type: string, urgency: string) => {
    if (urgency === 'high') {
      return 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400';
    }
    
    switch (type) {
      case 'new_key_request':
      case 'new_key_order':
        return 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400';
      case 'new_supply_request':
        return 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400';
      case 'new_issue':
      case 'issue_status_change':
        return 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400';
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
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Admin Notifications</h3>
            {notifications && notifications.length > 0 && unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAllNotifications}>
                Mark All Read
              </Button>
            )}
          </div>
        </div>
        
        <ScrollArea className="h-96">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              <div className="animate-pulse">Loading notifications...</div>
            </div>
          ) : !notifications || notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No new notifications</p>
            </div>
          ) : (
            <div className="p-2">
              {notifications.map((notification) => {
                const Icon = getNotificationIcon(notification.notification_type);
                const isRead = notification.read_by && notification.read_by.length > 0;
                
                return (
                  <Card 
                    key={notification.id}
                    className={`mb-2 cursor-pointer transition-colors hover:bg-muted ${
                      !isRead ? 'border-primary bg-primary/5' : 'border-muted'
                    }`}
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
                            {notification.urgency === 'high' && (
                              <Badge variant="destructive" className="text-xs">
                                {notification.urgency.toUpperCase()}
                              </Badge>
                            )}
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