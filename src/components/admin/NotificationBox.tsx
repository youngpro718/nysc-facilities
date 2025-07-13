import { useState, useEffect } from "react";
import { Bell, Key, AlertTriangle, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Notification {
  id: string;
  type: 'key_request' | 'issue' | 'maintenance';
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
  reference_id: string;
}

const notificationIcons = {
  key_request: Key,
  issue: AlertTriangle,
  maintenance: Wrench,
};

export const NotificationBox = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Fetch initial notifications
    fetchNotifications();

    // Set up real-time subscription for key requests
    const keyRequestsChannel = supabase
      .channel('key-request-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'key_requests'
        },
        (payload) => {
          console.log('New key request:', payload);
          const newNotification: Notification = {
            id: payload.new.id,
            type: 'key_request',
            title: 'New Key Request',
            message: `New ${payload.new.request_type} key request received`,
            created_at: payload.new.created_at,
            is_read: false,
            reference_id: payload.new.id,
          };
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(keyRequestsChannel);
    };
  }, [user]);

  const fetchNotifications = async () => {
    // Fetch recent key requests as notifications
    const { data: keyRequests } = await supabase
      .from('key_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(10);

    if (keyRequests) {
      const keyRequestNotifications: Notification[] = keyRequests.map(request => ({
        id: request.id,
        type: 'key_request',
        title: 'Key Request',
        message: `${request.request_type} key request pending approval`,
        created_at: request.created_at,
        is_read: false,
        reference_id: request.id,
      }));

      setNotifications(keyRequestNotifications);
      setUnreadCount(keyRequestNotifications.length);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    setIsOpen(false);
    
    switch (notification.type) {
      case 'key_request':
        navigate(`/admin/key-requests?id=${notification.reference_id}`);
        break;
      case 'issue':
        navigate(`/admin/issues?id=${notification.reference_id}`);
        break;
      case 'maintenance':
        navigate(`/admin/maintenance?id=${notification.reference_id}`);
        break;
    }

    // Mark as read
    markAsRead(notification.id);
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
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
            <h3 className="font-semibold">Notifications</h3>
            {notifications.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAllNotifications}>
                Clear All
              </Button>
            )}
          </div>
        </div>
        
        <ScrollArea className="h-96">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No new notifications</p>
            </div>
          ) : (
            <div className="p-2">
              {notifications.map((notification) => {
                const Icon = notificationIcons[notification.type];
                return (
                  <Card 
                    key={notification.id}
                    className={`mb-2 cursor-pointer transition-colors hover:bg-muted ${
                      !notification.is_read ? 'border-primary' : 'border-muted'
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-full ${
                          notification.type === 'key_request' ? 'bg-blue-100 text-blue-600' :
                          notification.type === 'issue' ? 'bg-red-100 text-red-600' :
                          'bg-yellow-100 text-yellow-600'
                        }`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{notification.title}</p>
                          <p className="text-sm text-muted-foreground">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                        </div>
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-primary rounded-full mt-2" />
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