import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Building2, Users, Wrench, AlertTriangle, MapPin, Phone, Calendar, Power, PowerOff } from 'lucide-react';
import { QuickActionsPanel } from './QuickActionsPanel';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { useCourtIssuesIntegration } from '@/hooks/useCourtIssuesIntegration';
import { CreateShutdownDialog } from './CreateShutdownDialog';
import { OpenRoomFlowDialog } from './OpenRoomFlowDialog';

interface CourtRoom {
  id: string;
  room_id: string;
  room_number: string;
  courtroom_number: string | null;
  is_active: boolean;
  operational_status?: 'open' | 'occupied' | null;
}

interface CourtAssignment {
  room_id?: string;
  id?: string;
  sort_order?: number | null;
  room_number?: string;
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
  const [shutdownDialogOpen, setShutdownDialogOpen] = useState(false);
  const [openRoomDialogOpen, setOpenRoomDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { hasUrgentIssues, getCourtImpactSummary, getIssuesForRoom } = useCourtIssuesIntegration();
  const { toast } = useToast();

  const { data: roomsData, isLoading, isError, error } = useQuery<RoomDetails[]>({
    queryKey: ['interactive-operations'],
    queryFn: async () => {
      // Get all court rooms
      const { data: courtrooms, error: courtroomsError } = await supabase
        .from("court_rooms")
        .select("id, room_id, room_number, courtroom_number, is_active")
        .order("room_number");
      if (courtroomsError) {
        logger.error('Failed to load court rooms', courtroomsError);
        throw new Error('Unable to load court rooms');
      }

      // Get all assignments with parts
      const { data: assignments, error: assignmentsError } = await supabase
        .from("court_assignments")
        .select("room_id, id, sort_order, room_number, part, justice, clerks, sergeant, tel, fax, calendar_day")
        .not("part", "is", null)
        .not("part", "eq", "");
      if (assignmentsError) {
        logger.error('Failed to load court assignments', assignmentsError);
        throw new Error('Unable to load court assignments');
      }

      // Get all shutdowns
      const { data: shutdowns, error: shutdownsError } = await supabase
        .from("room_shutdowns")
        .select("court_room_id, status, temporary_location, reason")
        .or("status.eq.in_progress,status.eq.scheduled");
      if (shutdownsError) {
        logger.error('Failed to load room shutdowns', shutdownsError);
        throw new Error('Unable to load room shutdowns');
      }

      const assignmentMap = new Map(assignments?.map(a => [a.room_id, a]) || []);
      const shutdownMap = new Map(shutdowns?.map(s => [s.court_room_id, s]) || []);

      return (courtrooms || []).map(room => {
        const assignment = assignmentMap.get(room.room_id);
        const shutdown = shutdownMap.get(room.id);
        
        let status: RoomDetails['status'] = 'available';
        if (!room.is_active) status = 'inactive';
        else if (shutdown && ((shutdown as any).status === 'in_progress' || (shutdown as any).status === 'scheduled')) status = 'shutdown';
        else if (assignment) status = 'occupied';
        else if ((room as any).operational_status === 'occupied') status = 'occupied';
        else status = 'available';

        return {
          room,
          assignment,
          shutdown,
          status
        } as RoomDetails;
      }) as RoomDetails[];
    }
  });

  const filteredRooms = roomsData?.filter(room => {
    if (filter === 'all') return true;
    if (filter === 'urgent') return hasUrgentIssues(room.room.room_id);
    return room.status === filter;
  }) || [];

  const roomsToDisplay = filter === 'occupied'
    ? [...filteredRooms].sort((a, b) => {
        const ao = (a.assignment?.sort_order ?? Number.MAX_SAFE_INTEGER) as number;
        const bo = (b.assignment?.sort_order ?? Number.MAX_SAFE_INTEGER) as number;
        return ao - bo;
      })
    : filteredRooms;

  const toggleRoomStatus = async (roomId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('court_rooms')
      .update({ is_active: !currentStatus })
      .eq('id', roomId);

    if (error) {
      console.error('Error updating room status:', error);
      toast({
        title: 'Failed to update room status',
        description: 'Please try again or contact support if the problem persists.',
        variant: 'destructive',
      });
      return;
    }

    // Refresh the data
    queryClient.invalidateQueries({ queryKey: ['interactive-operations'] });
    
    // Close modal if open
    setSelectedRoom(null);
  };

  const setOperationalStatus = async (roomId: string, newStatus: 'open' | 'occupied' | null) => {
    const { error } = await supabase
      .from('court_rooms')
      .update({ operational_status: newStatus } as any)
      .eq('id', roomId);
    if (error) {
      console.error('Error updating operational_status:', error);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['interactive-operations'] });
    setSelectedRoom(null);
  };

  const impactSummary = getCourtImpactSummary();
  const urgentRoomsCount = roomsData?.filter(r => hasUrgentIssues(r.room.room_id)).length || 0;

  // Compute available target rooms for assignment moves: active, not shutdown, and available
  const availableTargets = (roomsData || [])
    .filter(r => r.status === 'available' && r.room.is_active)
    .map(r => ({ id: r.room.id, room_id: r.room.room_id, room_number: r.room.room_number }));

  const statusCounts = {
    total: roomsData?.length || 0,
    available: roomsData?.filter(r => r.status === 'available').length || 0,
    occupied: roomsData?.filter(r => r.status === 'occupied').length || 0,
    shutdown: roomsData?.filter(r => r.status === 'shutdown').length || 0,
    maintenance: roomsData?.filter(r => r.status === 'maintenance').length || 0,
    inactive: roomsData?.filter(r => r.status === 'inactive').length || 0,
    urgent: urgentRoomsCount,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 border-green-200';
      case 'occupied': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shutdown': return 'bg-red-100 text-red-800 border-red-200';
      case 'maintenance': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <Building2 className="h-4 w-4" />;
      case 'occupied': return <Users className="h-4 w-4" />;
      case 'shutdown': return <AlertTriangle className="h-4 w-4" />;
      case 'maintenance': return <Wrench className="h-4 w-4" />;
      case 'inactive': return <Wrench className="h-4 w-4" />;
      default: return <Building2 className="h-4 w-4" />;
    }
  };

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'occupied': return 'bg-blue-500';
      case 'shutdown': return 'bg-red-500';
      case 'maintenance': return 'bg-amber-500';
      case 'inactive': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading court operations...</div>;
  }

  if (isError) {
    return (
      <div className="p-8 text-center text-destructive">
        Failed to load court operations. Please try again later.
        {process.env.NODE_ENV !== 'production' && (
          <div className="mt-2 text-xs text-muted-foreground">{String(error)}</div>
        )}
      </div>
    );
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
          <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
            <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800 min-h-[110px]">
              <CardHeader className="pb-1 pt-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-green-800 dark:text-green-200 leading-tight">
                  <Building2 className="h-4 w-4" />
                  Available
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-1 pb-3">
                <div className="text-2xl font-bold text-green-600">{statusCounts.available}</div>
                <p className="text-xs text-green-700 dark:text-green-300">Ready for assignment</p>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800 min-h-[110px]">
              <CardHeader className="pb-1 pt-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-blue-800 dark:text-blue-200 leading-tight">
                  <Users className="h-4 w-4" />
                  Occupied
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-1 pb-3">
                <div className="text-2xl font-bold text-blue-600">{statusCounts.occupied}</div>
                <p className="text-xs text-blue-700 dark:text-blue-300">Currently assigned</p>
              </CardContent>
            </Card>

            <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800 min-h-[110px]">
              <CardHeader className="pb-1 pt-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-800 dark:text-red-200 leading-tight">
                  <AlertTriangle className="h-4 w-4" />
                  Shutdown
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-1 pb-3">
                <div className="text-2xl font-bold text-red-600">{statusCounts.shutdown}</div>
                <p className="text-xs text-red-700 dark:text-red-300">Temporarily closed</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 min-h-[110px]">
              <CardHeader className="pb-1 pt-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-slate-800 dark:text-slate-200 leading-tight">
                  <Wrench className="h-4 w-4" />
                  Inactive
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-1 pb-3">
                <div className="text-2xl font-bold text-slate-600">{statusCounts.inactive}</div>
                <p className="text-xs text-slate-700 dark:text-slate-300">Not in use</p>
              </CardContent>
            </Card>

            <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800 min-h-[110px]">
              <CardHeader className="pb-1 pt-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-amber-800 dark:text-amber-200 leading-tight">
                  <AlertTriangle className="h-4 w-4" />
                  Urgent Issues
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-1 pb-3">
                <div className="text-2xl font-bold text-amber-600">{statusCounts.urgent}</div>
                <p className="text-xs text-amber-700 dark:text-amber-300">Needs immediate attention</p>
              </CardContent>
            </Card>

          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-3 mt-1">
            {['all', 'available', 'occupied', 'shutdown', 'inactive', 'urgent'].map((filterType) => (
              <Button
                key={filterType}
                variant={filter === filterType ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(filterType)}
                className="capitalize"
              >
                {(() => {
                  const count = filterType === 'all'
                    ? statusCounts.total
                    : (statusCounts[filterType as keyof typeof statusCounts] ?? 0);
                  return `${filterType} (${count})`;
                })()}
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
        {roomsToDisplay.map((room) => (
          <div
            key={room.room.id}
            className={`group relative bg-card border rounded-lg p-3 cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/50 hover:bg-accent/50 ${hasUrgentIssues(room.room.room_id) ? 'ring-1 ring-red-500/40' : ''}`}
            onClick={() => setSelectedRoom(room)}
          >
            {/* Compact Header */}
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm text-foreground">{room.room.room_number}</span>
              <div className="flex items-center gap-1.5">
                {/* Unresolved issues count */}
                {getIssuesForRoom(room.room.room_id).length > 0 && (
                  <Badge variant="destructive" className="text-[10px] px-1 py-0 h-4 leading-none">
                    {getIssuesForRoom(room.room.room_id).length}
                  </Badge>
                )}
                {hasUrgentIssues(room.room.room_id) && (
                  <span title="Urgent issue affecting this room">
                    <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                  </span>
                )}
                <div className={`w-2.5 h-2.5 rounded-full ${getStatusDotColor(room.status)}`} />
              </div>
            </div>
            
            {/* Status Badge - Minimal */}
            <div className="text-xs font-medium text-muted-foreground capitalize mb-1">
              {room.status.replace('_', ' ')}
            </div>
            
            {/* Court Number - If exists */}
            {room.room.courtroom_number && (
              <div className="text-xs text-muted-foreground/80 mb-1">
                Court {room.room.courtroom_number}
              </div>
            )}
            
            {/* Quick Actions - Hover Reveal */}
            <div className="absolute inset-0 bg-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center">
              <div className="flex gap-1.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleRoomStatus(room.room.id, room.room.is_active);
                  }}
                  className="p-1.5 bg-background border rounded-md shadow-sm hover:shadow-md transition-all hover:scale-105"
                  title={room.room.is_active ? 'Mark inactive' : 'Mark active'}
                >
                  {room.room.is_active ? 
                    <PowerOff className="h-3 w-3 text-destructive" /> : 
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
                    className="p-1.5 bg-background border rounded-md shadow-sm hover:shadow-md transition-all hover:scale-105"
                    title="View assignment"
                  >
                    <Users className="h-3 w-3 text-primary" />
                  </button>
                )}
                
                {room.shutdown && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Quick view shutdown details
                      setSelectedRoom(room);
                    }}
                    className="p-1.5 bg-background border rounded-md shadow-sm hover:shadow-md transition-all hover:scale-105"
                    title="View shutdown"
                  >
                    <Wrench className="h-3 w-3 text-orange-600" />
                  </button>
                )}
              </div>
            </div>
            
            {/* Quick Info Tooltip - Hover */}
            <div className="absolute z-10 top-full left-0 mt-2 bg-popover border text-popover-foreground text-xs rounded-md px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-md">
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
          {/* Screen-reader only description for accessibility to match aria-describedby */}
          <p id="room-details-description" className="sr-only">
            Detailed status, assignment information, shutdown details, and quick actions for the selected courtroom.
          </p>
          
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4">
              {/* Quick Actions Header */}
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Quick Actions</h3>
                <div className="flex gap-2 flex-wrap md:flex-nowrap">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (selectedRoom?.room) {
                        toggleRoomStatus(selectedRoom.room.id, selectedRoom.room.is_active);
                      }
                    }}
                    className="text-xs"
                    disabled={!selectedRoom?.room}
                  >
                    {selectedRoom?.room.is_active ? <PowerOff className="h-3 w-3" /> : <Power className="h-3 w-3" />}
                  </Button>
                  <Button size="sm" className="text-xs" onClick={() => setOpenRoomDialogOpen(true)}>
                    Open Room…
                  </Button>
                </div>
              </div>

              {/* Status with Toggle */}
              <div>
                <h4 className="font-medium mb-2 text-sm text-foreground">Status</h4>
                <div className="flex items-center">
                  <Badge variant="outline" className="flex items-center gap-1">
                    {getStatusIcon(selectedRoom?.status || 'available')}
                    <span className="capitalize">{selectedRoom?.status?.replace('_', ' ')}</span>
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

              {/* Issues for this Room */}
              {selectedRoom && getIssuesForRoom(selectedRoom.room.room_id).length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 text-sm">Issues</h4>
                  <div className="space-y-2 text-sm bg-amber-50 dark:bg-amber-950 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                    {getIssuesForRoom(selectedRoom.room.room_id).slice(0, 3).map((issue) => (
                      <div key={issue.id} className="flex items-start justify-between">
                        <div>
                          <div className="font-medium flex items-center gap-1">
                            {issue.priority === 'urgent' && <AlertTriangle className="h-3.5 w-3.5 text-red-600" />}
                            {issue.title}
                          </div>
                          <div className="text-xs text-muted-foreground">Priority: {issue.priority}</div>
                        </div>
                        <Badge variant="outline" className="capitalize">{issue.status}</Badge>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex justify-end">
                    <Button
                      variant="link"
                      size="sm"
                      className="text-xs px-0"
                      onClick={() => {
                        navigate('/operations?tab=issues');
                        setSelectedRoom(null);
                      }}
                    >
                      View all issues
                    </Button>
                  </div>
                </div>
              )}

              {/* Assignment Details - Editable */}
              {selectedRoom?.assignment && (
                <div>
                  <h4 className="font-medium mb-2 text-sm text-foreground">Current Assignment</h4>
                  <div className="space-y-2 text-sm bg-muted border p-3 rounded-lg text-foreground">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Part:</span>
                      <span className="font-medium text-foreground">{selectedRoom.assignment.part}</span>
                    </div>
                    {selectedRoom.assignment.justice && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Justice:</span>
                        <span className="font-medium text-foreground">{selectedRoom.assignment.justice}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-start">
                      <span className="text-muted-foreground">Clerks:</span>
                      <span className="font-medium text-right text-foreground">
                        {Array.isArray(selectedRoom.assignment.clerks) && selectedRoom.assignment.clerks.length > 0
                          ? selectedRoom.assignment.clerks.join(', ')
                          : '—'}
                      </span>
                    </div>
                    {selectedRoom.assignment.sergeant && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Sergeant:</span>
                        <span className="font-medium text-foreground">{selectedRoom.assignment.sergeant}</span>
                      </div>
                    )}
                    {selectedRoom.assignment.calendar_day && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Calendar:</span>
                        <span className="font-medium text-foreground">{selectedRoom.assignment.calendar_day}</span>
                      </div>
                    )}
                    {selectedRoom.assignment.tel && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Phone:</span>
                        <span className="font-medium text-foreground">{selectedRoom.assignment.tel}</span>
                      </div>
                    )}
                    {selectedRoom.assignment.fax && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Fax:</span>
                        <span className="font-medium text-foreground">{selectedRoom.assignment.fax}</span>
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
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => {
                      if (selectedRoom?.room) {
                        navigate(`/court-operations?tab=assignments&room=${selectedRoom.room.room_id || selectedRoom.room.id}`);
                        setSelectedRoom(null);
                      }
                    }}
                  >
                    View in Assignments
                  </Button>
                </div>
              )}

              {/* Quick Links */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2 text-sm">Quick Links</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => {
                      if (selectedRoom?.room) {
                        navigate(`/court-operations?tab=assignments&room=${selectedRoom.room.room_id || selectedRoom.room.id}`);
                        setSelectedRoom(null);
                      }
                    }}
                  >
                    <Users className="h-3 w-3 mr-1" />
                    Assignments
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => {
                      navigate('/operations?tab=maintenance');
                      setSelectedRoom(null);
                    }}
                  >
                    <Wrench className="h-3 w-3 mr-1" />
                    Maintenance
                  </Button>
                </div>
                {false && selectedRoom && selectedRoom.status !== 'shutdown' && selectedRoom.room.is_active && (
                  <div className="mt-3 grid grid-cols-1 gap-2" />
                )}
              </div>
            </div>
          </ScrollArea>
          
          <DialogFooter className="mt-4">
            <Button
              variant={selectedRoom?.room.is_active ? "destructive" : "default"}
              onClick={() => {
                if (selectedRoom?.room) {
                  toggleRoomStatus(selectedRoom.room.id, selectedRoom.room.is_active);
                }
              }}
              className="w-full"
              disabled={!selectedRoom?.room}
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
      {selectedRoom && (
        <CreateShutdownDialog
          open={shutdownDialogOpen}
          onOpenChange={setShutdownDialogOpen}
          courtroomId={selectedRoom.room.id}
          roomNumber={selectedRoom.room.room_number}
        />
      )}
      {selectedRoom && (
        <OpenRoomFlowDialog
          open={openRoomDialogOpen}
          onOpenChange={setOpenRoomDialogOpen}
          room={{ id: selectedRoom.room.id, room_id: selectedRoom.room.room_id, room_number: selectedRoom.room.room_number }}
          hasAssignment={!!selectedRoom.assignment}
          availableTargets={availableTargets.filter(t => t.id !== selectedRoom.room.id)}
          onRequestShutdown={() => setShutdownDialogOpen(true)}
        />
      )}
    </div>
  );
}
