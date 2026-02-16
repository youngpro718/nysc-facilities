// @ts-nocheck
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, Plus, Trash2, GripVertical, Building } from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useHallwayLandmarks, useHallwayDetails } from '@/hooks/useHallwayLandmarks';
import { createLandmark, deleteLandmark, updateHallwayReferences } from '@/services/hallwayLandmarkService';
import { HallwayLandmark } from '@/types/walkthrough';
import { useHallwayRooms, useAddHallwayRoom, useRemoveHallwayRoom } from '@/hooks/useHallwayRooms';
import { supabase } from '@/lib/supabase';

interface LandmarkSetupDialogProps {
  hallwayId: string;
  hallwayName: string;
}

const LANDMARK_TYPES = [
  { value: 'elevator_bank', label: 'Elevator Bank' },
  { value: 'stairwell', label: 'Stairwell' },
  { value: 'entrance', label: 'Entrance' },
  { value: 'intersection', label: 'Intersection' },
  { value: 'room', label: 'Room' },
  { value: 'other', label: 'Other' },
];

export function LandmarkSetupDialog({ hallwayId, hallwayName }: LandmarkSetupDialogProps) {
  const [open, setOpen] = useState(false);
  const [startRef, setStartRef] = useState('');
  const [endRef, setEndRef] = useState('');
  const [newLandmark, setNewLandmark] = useState({
    name: '',
    type: 'elevator_bank' as HallwayLandmark['type'],
    fixtureStart: '',
    fixtureEnd: '',
  });
  const [newRoom, setNewRoom] = useState({
    room_id: '',
    position: 'start' as 'start' | 'middle' | 'end',
    side: 'left' as 'left' | 'right',
  });

  const queryClient = useQueryClient();
  const { data: landmarks = [] } = useHallwayLandmarks(hallwayId);
  const { data: hallwayDetails } = useHallwayDetails(hallwayId);
  const { data: hallwayRooms = [] } = useHallwayRooms(hallwayId);
  const addRoomMutation = useAddHallwayRoom();
  const removeRoomMutation = useRemoveHallwayRoom();

  // Fetch available rooms on the same floor
  const { data: availableRooms = [] } = useQuery({
    queryKey: ['floor-rooms', hallwayDetails?.floor_id],
    queryFn: async () => {
      if (!hallwayDetails?.floor_id) return [];
      const { data, error } = await supabase
        .from('rooms')
        .select('id, name, room_number')
        .eq('floor_id', hallwayDetails.floor_id)
        .order('room_number', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!hallwayDetails?.floor_id,
  });

  // Initialize start/end refs when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && hallwayDetails) {
      setStartRef(hallwayDetails.start_reference || '');
      setEndRef(hallwayDetails.end_reference || '');
    }
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const sequenceOrder = landmarks.length + 1;
      await createLandmark(
        hallwayId,
        newLandmark.name,
        newLandmark.type,
        sequenceOrder,
        newLandmark.fixtureStart ? parseInt(newLandmark.fixtureStart) : undefined,
        newLandmark.fixtureEnd ? parseInt(newLandmark.fixtureEnd) : undefined
      );
    },
    onSuccess: () => {
      toast.success('Landmark added');
      queryClient.invalidateQueries({ queryKey: ['hallway-landmarks', hallwayId] });
      setNewLandmark({ name: '', type: 'elevator_bank', fixtureStart: '', fixtureEnd: '' });
    },
    onError: () => toast.error('Failed to add landmark'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteLandmark,
    onSuccess: () => {
      toast.success('Landmark deleted');
      queryClient.invalidateQueries({ queryKey: ['hallway-landmarks', hallwayId] });
    },
    onError: () => toast.error('Failed to delete landmark'),
  });

  const updateReferencesMutation = useMutation({
    mutationFn: async () => {
      await updateHallwayReferences(hallwayId, startRef || undefined, endRef || undefined);
    },
    onSuccess: () => {
      toast.success('Route references updated');
      queryClient.invalidateQueries({ queryKey: ['hallway-details', hallwayId] });
    },
    onError: () => toast.error('Failed to update references'),
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
          <Settings className="h-4 w-4 mr-2" />
          Configure Route
        </Button>
      </DialogTrigger>
      <DialogContent 
        className="max-w-2xl max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onPointerDownOutside={(e) => {
          // Prevent closing when clicking Select dropdowns or any portal content
          const target = e.target as HTMLElement;
          if (
            target.closest('[role="listbox"]') || 
            target.closest('[data-radix-select-content]') ||
            target.closest('[data-radix-popper-content-wrapper]')
          ) {
            e.preventDefault();
          }
        }}
        onInteractOutside={(e) => {
          // Prevent dialog from closing on any interaction with form elements
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Configure Route: {hallwayName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Route Start/End References */}
          <div className="space-y-4">
            <h3 className="font-semibold">Route Direction</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Reference</Label>
                <Input
                  placeholder="e.g., White Street"
                  value={startRef}
                  onChange={(e) => setStartRef(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>End Reference</Label>
                <Input
                  placeholder="e.g., Hogan Place"
                  value={endRef}
                  onChange={(e) => setEndRef(e.target.value)}
                />
              </div>
            </div>
            <Button
              onClick={() => updateReferencesMutation.mutate()}
              disabled={updateReferencesMutation.isPending}
              size="sm"
            >
              Save Route Direction
            </Button>
          </div>

          {/* Existing Landmarks */}
          <div className="space-y-4">
            <h3 className="font-semibold">Landmarks ({landmarks.length})</h3>
            {landmarks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No landmarks yet. Add landmarks like "Bank A", "Stairwell B" to help navigate the route.
              </p>
            ) : (
              <div className="space-y-2">
                {landmarks.map((landmark) => (
                  <Card key={landmark.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{landmark.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {LANDMARK_TYPES.find(t => t.value === landmark.type)?.label}
                            {landmark.fixture_range_start && landmark.fixture_range_end && (
                              <> • Fixtures {landmark.fixture_range_start}-{landmark.fixture_range_end}</>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(landmark.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Add New Landmark */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold">Add New Landmark</h3>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    placeholder="e.g., Bank A"
                    value={newLandmark.name}
                    onChange={(e) => setNewLandmark({ ...newLandmark, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={newLandmark.type}
                    onValueChange={(value: HallwayLandmark['type']) =>
                      setNewLandmark({ ...newLandmark, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANDMARK_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fixture Range Start</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 1"
                    value={newLandmark.fixtureStart}
                    onChange={(e) =>
                      setNewLandmark({ ...newLandmark, fixtureStart: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fixture Range End</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 5"
                    value={newLandmark.fixtureEnd}
                    onChange={(e) =>
                      setNewLandmark({ ...newLandmark, fixtureEnd: e.target.value })
                    }
                  />
                </div>
              </div>

              <Button
                onClick={() => createMutation.mutate()}
                disabled={!newLandmark.name || createMutation.isPending}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Landmark
              </Button>
            </div>
          </div>

          {/* Rooms Along Route */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              <h3 className="font-semibold">Rooms Along Route</h3>
              <Badge variant="secondary" className="ml-auto">{hallwayRooms.length}</Badge>
            </div>
            
            {hallwayRooms.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No rooms assigned yet. Assign rooms to help technicians identify nearby spaces.
              </p>
            ) : (
              <div className="space-y-2">
                {hallwayRooms.map((hallwayRoom) => (
                  <Card key={hallwayRoom.id}>
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col gap-1">
                          <div className="font-medium text-sm">
                            {hallwayRoom.room.room_number} - {hallwayRoom.room.name}
                          </div>
                          <div className="flex gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                              {hallwayRoom.position}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {hallwayRoom.side}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRoomMutation.mutate({ id: hallwayRoom.id, hallwayId })}
                        disabled={removeRoomMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Add New Room */}
            <div className="space-y-3 pt-2">
              <h4 className="text-sm font-medium">Assign Room</h4>
              <div className="grid gap-3">
                <div className="space-y-2">
                  <Label>Room</Label>
                  <Select
                    value={newRoom.room_id}
                    onValueChange={(value) => setNewRoom({ ...newRoom, room_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select room..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRooms
                        .filter(room => !hallwayRooms.find(hr => hr.room_id === room.id))
                        .map((room: Record<string, unknown>) => (
                          <SelectItem key={room.id} value={room.id}>
                            {room.room_number} - {room.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Position</Label>
                    <Select
                      value={newRoom.position}
                      onValueChange={(value: 'start' | 'middle' | 'end') =>
                        setNewRoom({ ...newRoom, position: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="start">Start</SelectItem>
                        <SelectItem value="middle">Middle</SelectItem>
                        <SelectItem value="end">End</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Side</Label>
                    <Select
                      value={newRoom.side}
                      onValueChange={(value: 'left' | 'right') =>
                        setNewRoom({ ...newRoom, side: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    addRoomMutation.mutate({
                      hallway_id: hallwayId,
                      room_id: newRoom.room_id,
                      position: newRoom.position,
                      side: newRoom.side,
                    });
                    setNewRoom({ room_id: '', position: 'start', side: 'left' });
                  }}
                  disabled={!newRoom.room_id || addRoomMutation.isPending}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Room
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
