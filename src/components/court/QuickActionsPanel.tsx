import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Calendar, MapPin, Clock, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';

type ActionType = 'shutdown_ending' | 'no_assignment' | 'maintenance_soon' | 'temp_location';

type ShutdownDetails = {
  status?: string | null;
  temporary_location?: string | null;
  reason?: string | null;
  created_at?: string | null;
  court_rooms?: { id: string; room_id: string; room_number: string } | null;
};

type MaintenanceSoonDetails = {
  scheduled_start_date: string;
  scheduled_end_date?: string | null;
} | undefined;

type TempLocationDetails = {
  location: string;
} | undefined;

interface ActionItemBase {
  room_id: string;
  room_number: string;
  message: string;
  urgency: 'high' | 'medium' | 'low';
}

type ActionItem =
  | (ActionItemBase & { type: 'shutdown_ending'; details?: ShutdownDetails })
  | (ActionItemBase & { type: 'no_assignment'; details?: undefined })
  | (ActionItemBase & { type: 'maintenance_soon'; details?: MaintenanceSoonDetails })
  | (ActionItemBase & { type: 'temp_location'; details?: TempLocationDetails });

export function QuickActionsPanel() {
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: actionItems, isLoading, error } = useQuery({
    queryKey: ['quick-actions'],
    queryFn: async () => {
      const items: ActionItem[] = [];

      try {
        // Get active or scheduled shutdowns (not specifically filtered by ending soon)
        const { data: shutdowns, error: shutdownsError } = await supabase
          .from("room_shutdowns")
          .select("*, court_rooms(id, room_id, room_number)")
          .or("status.eq.in_progress,status.eq.scheduled")
          .order("created_at", { ascending: false });
        if (shutdownsError) throw shutdownsError;

        shutdowns?.forEach((shutdown: any) => {
          if (shutdown.court_rooms) {
            items.push({
              room_id: shutdown.court_rooms.room_id,
              room_number: shutdown.court_rooms.room_number,
              type: 'shutdown_ending',
              message: `Shutdown active: ${shutdown.reason}`,
              urgency: 'high',
              details: shutdown
            });
          }
        });
      } catch (e) {
        console.error('[QuickActionsPanel] Failed to fetch shutdowns', e);
        throw e;
      }

      let assignedRooms: Set<string> = new Set();
      try {
        // Get rooms without assignments
        const { data: assignments, error: assignmentsError } = await supabase
          .from("court_assignments")
          .select("room_id, part")
          .not("part", "is", null)
          .not("part", "eq", "");
        if (assignmentsError) throw assignmentsError;

        assignedRooms = new Set((assignments || []).map((a: { room_id: string }) => a.room_id).filter(Boolean));
      } catch (e) {
        console.error('[QuickActionsPanel] Failed to fetch assignments', e);
        throw e;
      }

      try {
        const { data: allRooms, error: roomsError } = await supabase
          .from("court_rooms")
          .select("id, room_id, room_number, is_active")
          .eq("is_active", true);
        if (roomsError) throw roomsError;

        allRooms?.forEach((room: { room_id: string; room_number: string }) => {
          if (!assignedRooms.has(room.room_id)) {
            items.push({
              room_id: room.room_id,
              room_number: room.room_number,
              type: 'no_assignment',
              message: 'Available for assignment',
              urgency: 'low'
            });
          }
        });
      } catch (e) {
        console.error('[QuickActionsPanel] Failed to fetch rooms', e);
        throw e;
      }

      return items;
    }
  });

  // Loading and error feedback
  if (isLoading) {
    return (
      <div className="space-y-4 min-w-[280px] max-w-full">
        <Card className="sticky top-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Quick Actions & Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Loading quick actions…</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 min-w-[280px] max-w-full">
        <Card className="sticky top-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Quick Actions & Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-destructive">Failed to load quick actions: {(error as Error).message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredItems = actionItems?.filter(item => 
    item.room_number.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'shutdown_ending': return <AlertTriangle className="h-4 w-4" />;
      case 'no_assignment': return <Search className="h-4 w-4" />;
      case 'maintenance_soon': return <Calendar className="h-4 w-4" />;
      case 'temp_location': return <MapPin className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getUrgencyVariant = (urgency: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (urgency) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-4 min-w-[280px] max-w-full">
      <Card className="sticky top-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Quick Actions & Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Search rooms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-4"
          />
          
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {filteredItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No items need attention
              </p>
            ) : (
              filteredItems.map((item) => (
                <div key={`${item.type}-${item.room_id}`} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors duration-200">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex-shrink-0 p-2 rounded-full bg-primary/10 text-primary">
                      {getActionIcon(item.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-foreground">Room {item.room_number}</div>
                      <div className="text-sm text-muted-foreground truncate">{item.message}</div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-3 flex items-center gap-2 flex-wrap justify-end">
                    <Badge variant={getUrgencyVariant(item.urgency)} className="capitalize whitespace-nowrap">
                      {item.urgency}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs whitespace-nowrap"
                      onClick={() => navigate(`/court-operations?tab=assignments&room=${item.room_id}`)}
                    >
                      Open
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
