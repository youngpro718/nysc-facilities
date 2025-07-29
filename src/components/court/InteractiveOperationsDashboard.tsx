import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Building2, Users, Wrench, AlertTriangle, MapPin, Phone, Calendar, Power, PowerOff } from 'lucide-react';
import { QuickActionsPanel } from './QuickActionsPanel';

interface CourtRoom {
  id: string;
  room_number: string;
  courtroom_number: string | null;
  is_active: boolean;
}

interface CourtAssignment {
  room_number: string;
  part: string;
  justice: string | null;
  clerks: string[] | null;
  sergeant: string | null;
  tel: string | null;
  fax: string | null;
  calendar_day: string | null;
}

interface RoomShutdown {
  court_room_id: string;
  status: string;
  temporary_location: string | null;
  reason: string;
}

interface RoomDetails {
  room: CourtRoom;
  assignment: CourtAssignment | null;
  shutdown: RoomShutdown | null;
  status: 'available' | 'occupied' | 'shutdown' | 'maintenance' | 'inactive';
}

export function InteractiveOperationsDashboard() {
  const [selectedRoom, setSelectedRoom] = useState<RoomDetails | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const queryClient = useQueryClient();

  const { data: roomsData, isLoading } = useQuery({
    queryKey: ['interactive-operations'],
    queryFn: async () => {
      // Get all court rooms
      const { data: courtrooms } = await supabase
        .from("court_rooms")
        .select("id, room_number, courtroom_number, is_active")
        .order("room_number");

      // Get all assignments with parts
      const { data: assignments } = await supabase
        .from("court_assignments")
        .select("room_number, part, justice, clerks, sergeant, tel, fax, calendar_day")
        .not("part", "is", null)
        .not("part", "eq", "");

      // Get all shutdowns
      const { data: shutdowns } = await supabase
        .from("room_shutdowns")
        .select("court_room_id, status, temporary_location, reason")
        .or("status.eq.in_progress,status.eq.scheduled");

      const assignmentMap = new Map(assignments?.map(a => [a.room_number, a]) || []);
      const shutdownMap = new Map(shutdowns?.map(s => [s.court_room_id, s]) || []);

      return (courtrooms || []).map(room => {
        const assignment = assignmentMap.get(room.room_number);
        const shutdown = shutdownMap.get(room.id);
        
        let status: RoomDetails['status'] = 'available';
        if (!room.is_active) status = 'inactive';
        else if (shutdown && (shutdown.status === 'in_progress' || shutdown.status === 'scheduled')) status = 'shutdown';
        else if (assignment) status = 'occupied';

        return {
          room,
          assignment,
          shutdown,
          status
        };
      });
    }
  });

  const filteredRooms = roomsData?.filter(room => {
    if (filter === 'all') return true;
    return room.status === filter;
  }) || [];

  const toggleRoomStatus = async (roomId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('court_rooms')
      .update({ is_active: !currentStatus })
      .eq('id', roomId);

    if (error) {
      console.error('Error updating room status:', error);
      return;
    }

    // Refresh the data
    queryClient.invalidateQueries({ queryKey: ['interactive-operations'] });
    
    // Close modal if open
    setSelectedRoom(null);
  };

  const statusCounts = {
    total: roomsData?.length || 0,
    available: roomsData?.filter(r => r.status === 'available').length || 0,
    occupied: roomsData?.filter(r => r.status === 'occupied').length || 0,
    shutdown: roomsData?.filter(r => r.status === 'shutdown').length || 0,
    inactive: roomsData?.filter(r => r.status === 'inactive').length || 0,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 border-green-200';
      case 'occupied': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shutdown': return 'bg-red-100 text-red-800 border-red-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <Building2 className="h-4 w-4" />;
      case 'occupied': return <Users className="h-4 w-4" />;
      case 'shutdown': return <AlertTriangle className="h-4 w-4" />;
      case 'inactive': return <Wrench className="h-4 w-4" />;
      default: return <Building2 className="h-4 w-4" />;
    }
  };

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'occupied': return 'bg-blue-500';
      case 'shutdown': return 'bg-red-500';
      case 'inactive': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading court operations...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold mb-2">Court Operations Overview</h1>
            <p className="text-muted-foreground">Interactive view of all courtroom statuses</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-r from-green-50 to-green-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Available
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-700">{statusCounts.available}</div>
                <p className="text-xs text-green-600">Ready for assignment</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Occupied
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-700">{statusCounts.occupied}</div>
                <p className="text-xs text-blue-600">Currently assigned</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-red-50 to-red-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Shutdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-700">{statusCounts.shutdown}</div>
                <p className="text-xs text-red-600">Temporarily closed</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-gray-50 to-gray-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  Inactive
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-700">{statusCounts.inactive}</div>
                <p className="text-xs text-gray-600">Not in use</p>
              </CardContent>
            </Card>
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            {['all', 'available', 'occupied', 'shutdown', 'inactive'].map((filterType) => (
              <Button
                key={filterType}
                variant={filter === filterType ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(filterType)}
                className="capitalize"
              >
                {filterType} ({filterType === 'all' ? statusCounts.total : statusCounts[filterType as keyof typeof statusCounts]})
              </Button>
            ))}
          </div>
        </div>
        
        <div className="space-y-6">
          <QuickActionsPanel />
        </div>
      </div>

      {/* Interactive Room Grid - Compact Tiles */}
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
        {filteredRooms.map((room) => (
          <div
            key={room.room.id}
            className="group relative bg-white border rounded-lg p-2 cursor-pointer hover:shadow-md transition-all duration-200 hover:border-blue-400"
            onClick={() => setSelectedRoom(room)}
          >
            {/* Compact Header */}
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-sm">{room.room.room_number}</span>
              <div className={`w-2 h-2 rounded-full ${getStatusDotColor(room.status)}`} />
            </div>
            
            {/* Status Badge - Minimal */}
            <div className="text-xs font-medium text-gray-600 capitalize mb-1">
              {room.status}
            </div>
            
            {/* Court Number - If exists */}
            {room.room.courtroom_number && (
              <div className="text-xs text-gray-500 mb-1">
                C{room.room.courtroom_number}
              </div>
            )}
            
            {/* Quick Actions - Hover Reveal */}
            <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center">
              <div className="flex gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleRoomStatus(room.room.id, room.room.is_active);
                  }}
                  className="p-1 bg-white rounded shadow-sm hover:shadow-md transition-shadow"
                  title={room.room.is_active ? 'Mark inactive' : 'Mark active'}
                >
                  {room.room.is_active ? 
                    <PowerOff className="h-3 w-3 text-red-600" /> : 
                    <Power className="h-3 w-3 text-green-600" />
                  }
                </button>
                
                {room.assignment && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Quick view assignment details
                      setSelectedRoom(room);
                    }}
                    className="p-1 bg-white rounded shadow-sm hover:shadow-md transition-shadow"
                    title="View assignment"
                  >
                    <Users className="h-3 w-3 text-blue-600" />
                  </button>
                )}
                
                {room.shutdown && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Quick view shutdown details
                      setSelectedRoom(room);
                    }}
                    className="p-1 bg-white rounded shadow-sm hover:shadow-md transition-shadow"
                    title="View shutdown"
                  >
                    <Wrench className="h-3 w-3 text-orange-600" />
                  </button>
                )}
              </div>
            </div>
            
            {/* Quick Info Tooltip - Hover */}
            <div className="absolute z-10 top-full left-0 mt-1 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
              {room.assignment?.part ? `Part: ${room.assignment.part}` : 'Available'}
              {room.shutdown?.reason && ` • ${room.shutdown.reason}`}
            </div>
          </div>
        ))}
      </div>

      {/* Room Details Modal */}
      <Dialog open={!!selectedRoom} onOpenChange={() => setSelectedRoom(null)}>
        <DialogContent className="max-w-md" aria-describedby="room-details-description">
          <DialogHeader>
            <DialogTitle className="text-xl">
              Room {selectedRoom?.room.room_number}
              {selectedRoom?.room.courtroom_number && (
                <span className="text-muted-foreground text-base ml-2">
                  (Court {selectedRoom.room.courtroom_number})
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4">
              {/* Quick Actions Header */}
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Quick Actions</h3>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleRoomStatus(selectedRoom!.room.id, selectedRoom!.room.is_active)}
                    className="text-xs"
                  >
                    {selectedRoom?.room.is_active ? <PowerOff className="h-3 w-3" /> : <Power className="h-3 w-3" />}
                  </Button>
                </div>
              </div>

              {/* Status with Toggle */}
              <div>
                <h4 className="font-medium mb-2 text-sm">Status</h4>
                <div className="flex items-center">
                  <Badge className={getStatusColor(selectedRoom?.status || 'available')}>
                    {getStatusIcon(selectedRoom?.status || 'available')}
                    <span className="ml-1 capitalize">{selectedRoom?.status}</span>
                  </Badge>
                </div>
              </div>

              {/* Room Details */}
              <div>
                <h4 className="font-medium mb-2 text-sm">Room Details</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Room Number:</span>
                    <span className="font-medium">{selectedRoom?.room.room_number}</span>
                  </div>
                  {selectedRoom?.room.courtroom_number && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Court Number:</span>
                      <span className="font-medium">{selectedRoom.room.courtroom_number}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Assignment Details - Editable */}
              {selectedRoom?.assignment && (
                <div>
                  <h4 className="font-medium mb-2 text-sm">Current Assignment</h4>
                  <div className="space-y-2 text-sm bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Part:</span>
                      <span className="font-medium">{selectedRoom.assignment.part}</span>
                    </div>
                    {selectedRoom.assignment.justice && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Justice:</span>
                        <span className="font-medium">{selectedRoom.assignment.justice}</span>
                      </div>
                    )}
                    {selectedRoom.assignment.clerks && (
                      <div className="flex justify-between items-start">
                        <span className="text-muted-foreground">Clerks:</span>
                        <span className="font-medium text-right">{selectedRoom.assignment.clerks.join(', ')}</span>
                      </div>
                    )}
                    {selectedRoom.assignment.sergeant && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Sergeant:</span>
                        <span className="font-medium">{selectedRoom.assignment.sergeant}</span>
                      </div>
                    )}
                    {selectedRoom.assignment.calendar_day && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Calendar:</span>
                        <span className="font-medium">{selectedRoom.assignment.calendar_day}</span>
                      </div>
                    )}
                    {selectedRoom.assignment.tel && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Phone:</span>
                        <span className="font-medium">{selectedRoom.assignment.tel}</span>
                      </div>
                    )}
                    {selectedRoom.assignment.fax && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Fax:</span>
                        <span className="font-medium">{selectedRoom.assignment.fax}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Shutdown Details */}
              {selectedRoom?.shutdown && (
                <div>
                  <h4 className="font-medium mb-2 text-sm">Shutdown Details</h4>
                  <div className="space-y-2 text-sm bg-orange-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Reason:</span>
                      <span className="font-medium">{selectedRoom.shutdown.reason}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Status:</span>
                      <span className="font-medium capitalize">{selectedRoom.shutdown.status}</span>
                    </div>
                    {selectedRoom.shutdown.temporary_location && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Temp Location:</span>
                        <span className="font-medium">{selectedRoom.shutdown.temporary_location}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Available Room Actions */}
              {!selectedRoom?.assignment && selectedRoom?.status === 'available' && (
                <div className="text-center py-4">
                  <p className="text-muted-foreground text-sm mb-3">This room is available for assignment</p>
                  <Button size="sm" variant="outline" className="text-xs">
                    View in Assignments
                  </Button>
                </div>
              )}

              {/* Quick Links */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2 text-sm">Quick Links</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" variant="outline" className="text-xs">
                    <Users className="h-3 w-3 mr-1" />
                    Assignments
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs">
                    <Wrench className="h-3 w-3 mr-1" />
                    Maintenance
                  </Button>
                </div>
              </div>
            </div>
          </ScrollArea>
          
          <DialogFooter className="mt-4">
            <Button
              variant={selectedRoom?.room.is_active ? "destructive" : "default"}
              onClick={() => toggleRoomStatus(selectedRoom!.room.id, selectedRoom!.room.is_active)}
              className="w-full"
            >
              {selectedRoom?.room.is_active ? (
                <>
                  <PowerOff className="h-4 w-4 mr-2" />
                  Mark Room Inactive
                </>
              ) : (
                <>
                  <Power className="h-4 w-4 mr-2" />
                  Mark Room Active
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
