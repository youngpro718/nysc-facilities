import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Bell, 
  CheckCircle2, 
  UserPlus, 
  UserMinus, 
  Edit3,
  X,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RealTimeUpdate {
  id: string;
  type: 'created' | 'updated' | 'deleted';
  assignment_id: string;
  occupant_name: string;
  room_number: string;
  timestamp: string;
  changes?: Record<string, any>;
}

interface RealTimeUpdatesProps {
  onUpdateReceived: () => void;
}

export function RealTimeUpdates({ onUpdateReceived }: RealTimeUpdatesProps) {
  const [updates, setUpdates] = useState<RealTimeUpdate[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Subscribe to real-time changes on the occupant_room_assignments table
    const channel = supabase
      .channel('room-assignments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'occupant_room_assignments'
        },
        (payload) => {
          handleRealTimeUpdate(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleRealTimeUpdate = async (payload: any) => {
    try {
      let occupantName = 'Unknown';
      let roomNumber = 'Unknown';

      // Try to get occupant and room details
      if (payload.new?.occupant_id) {
        const { data: occupant } = await supabase
          .from('occupants')
          .select('first_name, last_name')
          .eq('id', payload.new.occupant_id)
          .single();
        
        if (occupant) {
          occupantName = `${occupant.first_name} ${occupant.last_name}`;
        }
      }

      if (payload.new?.room_id || payload.old?.room_id) {
        const roomId = payload.new?.room_id || payload.old?.room_id;
        const { data: room } = await supabase
          .from('rooms')
          .select('room_number')
          .eq('id', roomId)
          .single();
        
        if (room) {
          roomNumber = room.room_number;
        }
      }

      const update: RealTimeUpdate = {
        id: `${Date.now()}-${Math.random()}`,
        type: payload.eventType === 'INSERT' ? 'created' : 
              payload.eventType === 'UPDATE' ? 'updated' : 'deleted',
        assignment_id: payload.new?.id || payload.old?.id,
        occupant_name: occupantName,
        room_number: roomNumber,
        timestamp: new Date().toISOString(),
        changes: payload.eventType === 'UPDATE' ? {
          old: payload.old,
          new: payload.new
        } : undefined
      };

      setUpdates(prev => [update, ...prev.slice(0, 19)]); // Keep last 20 updates
      setUnreadCount(prev => prev + 1);

      // Show toast notification
      const message = getUpdateMessage(update);
      toast.info(message, {
        duration: 5000,
        action: {
          label: 'View',
          onClick: () => setIsVisible(true)
        }
      });

      // Notify parent component to refresh data
      onUpdateReceived();

    } catch (error) {
      console.error('Error handling real-time update:', error);
    }
  };

  const getUpdateMessage = (update: RealTimeUpdate) => {
    switch (update.type) {
      case 'created':
        return `New assignment: ${update.occupant_name} → Room ${update.room_number}`;
      case 'updated':
        return `Assignment updated: ${update.occupant_name} in Room ${update.room_number}`;
      case 'deleted':
        return `Assignment removed: ${update.occupant_name} from Room ${update.room_number}`;
      default:
        return 'Assignment changed';
    }
  };

  const getUpdateIcon = (type: string) => {
    switch (type) {
      case 'created':
        return <UserPlus className="h-4 w-4 text-green-600" />;
      case 'updated':
        return <Edit3 className="h-4 w-4 text-blue-600" />;
      case 'deleted':
        return <UserMinus className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getUpdateBadgeVariant = (type: string) => {
    switch (type) {
      case 'created':
        return 'default' as const;
      case 'updated':
        return 'secondary' as const;
      case 'deleted':
        return 'destructive' as const;
      default:
        return 'outline' as const;
    }
  };

  const markAllAsRead = () => {
    setUnreadCount(0);
  };

  const clearUpdates = () => {
    setUpdates([]);
    setUnreadCount(0);
  };

  return (
    <>
      {/* Notification Bell */}
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setIsVisible(!isVisible);
            if (!isVisible) markAllAsRead();
          }}
          className="relative"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>

        {/* Updates Panel */}
        {isVisible && (
          <Card className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-hidden z-50 shadow-lg">
            <div className="p-4 border-b bg-muted/50">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Real-time Updates</h3>
                <div className="flex items-center gap-2">
                  {updates.length > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={clearUpdates}
                      className="text-xs"
                    >
                      Clear
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsVisible(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {updates.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recent updates</p>
                </div>
              ) : (
                <div className="divide-y">
                  {updates.map((update) => (
                    <div key={update.id} className="p-3 hover:bg-muted/50">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {getUpdateIcon(update.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge 
                              variant={getUpdateBadgeVariant(update.type)}
                              className="text-xs"
                            >
                              {update.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(update.timestamp), 'HH:mm')}
                            </span>
                          </div>
                          <p className="text-sm font-medium">{update.occupant_name}</p>
                          <p className="text-xs text-muted-foreground">
                            Room {update.room_number}
                          </p>
                          {update.changes && (
                            <div className="mt-2 text-xs text-muted-foreground">
                              {Object.entries(update.changes.new || {})
                                .filter(([key, value]) => 
                                  value !== update.changes?.old?.[key] && 
                                  !['id', 'updated_at', 'created_at'].includes(key)
                                )
                                .slice(0, 2)
                                .map(([key, value]) => (
                                  <div key={key}>
                                    {key}: {String(value)}
                                  </div>
                                ))
                              }
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {updates.length > 0 && (
              <div className="p-3 border-t bg-muted/25">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="w-full text-xs"
                >
                  <CheckCircle2 className="h-3 w-3 mr-2" />
                  Mark all as read
                </Button>
              </div>
            )}
          </Card>
        )}
      </div>
    </>
  );
}