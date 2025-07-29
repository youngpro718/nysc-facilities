import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Calendar, MapPin, Clock, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface ActionItem {
  room_number: string;
  type: 'shutdown_ending' | 'no_assignment' | 'maintenance_soon' | 'temp_location';
  message: string;
  urgency: 'high' | 'medium' | 'low';
  details?: any;
}

export function QuickActionsPanel() {
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: actionItems } = useQuery({
    queryKey: ['quick-actions'],
    queryFn: async () => {
      const items: ActionItem[] = [];

      // Get shutdowns ending soon
      const { data: shutdowns } = await supabase
        .from("room_shutdowns")
        .select("*, court_rooms(room_number)")
        .or("status.eq.in_progress,status.eq.scheduled")
        .order("created_at", { ascending: false });

      shutdowns?.forEach(shutdown => {
        if (shutdown.court_rooms) {
          items.push({
            room_number: shutdown.court_rooms.room_number,
            type: 'shutdown_ending',
            message: `Shutdown active: ${shutdown.reason}`,
            urgency: 'high',
            details: shutdown
          });
        }
      });

      // Get rooms without assignments
      const { data: assignments } = await supabase
        .from("court_assignments")
        .select("room_number")
        .not("part", "is", null)
        .not("part", "eq", "");

      const assignedRooms = new Set(assignments?.map(a => a.room_number) || []);
      
      const { data: allRooms } = await supabase
        .from("court_rooms")
        .select("room_number, is_active")
        .eq("is_active", true);

      allRooms?.forEach(room => {
        if (!assignedRooms.has(room.room_number)) {
          items.push({
            room_number: room.room_number,
            type: 'no_assignment',
            message: 'Available for assignment',
            urgency: 'low'
          });
        }
      });

      return items;
    }
  });

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

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
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
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {filteredItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No items need attention
              </p>
            ) : (
              filteredItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="text-blue-600">
                      {getActionIcon(item.type)}
                    </div>
                    <div>
                      <div className="font-medium">Room {item.room_number}</div>
                      <div className="text-sm text-muted-foreground">{item.message}</div>
                    </div>
                  </div>
                  <Badge className={getUrgencyColor(item.urgency)}>
                    {item.urgency}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
