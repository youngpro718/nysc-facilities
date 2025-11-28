import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MapPin, Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAddHallwayRoom } from '@/hooks/useHallwayRooms';

interface QuickRoomAssignmentProps {
  hallwayId: string;
  floorId: string;
  currentProgress: number; // 0-1
  assignedRoomIds: string[];
}

export function QuickRoomAssignment({ 
  hallwayId, 
  floorId, 
  currentProgress, 
  assignedRoomIds 
}: QuickRoomAssignmentProps) {
  const [open, setOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [side, setSide] = useState<'left' | 'right'>('left');

  // Auto-determine position based on progress
  const position: 'start' | 'middle' | 'end' = 
    currentProgress < 0.33 ? 'start' : 
    currentProgress < 0.67 ? 'middle' : 
    'end';

  const addRoomMutation = useAddHallwayRoom();

  // Fetch available rooms on this floor
  const { data: availableRooms = [] } = useQuery({
    queryKey: ['floor-rooms', floorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select('id, name, room_number, ceiling_height, primary_bulb_type')
        .eq('floor_id', floorId)
        .order('room_number', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: open && !!floorId,
  });

  const unassignedRooms = availableRooms.filter(
    room => !assignedRoomIds.includes(room.id)
  );

  const handleAssign = () => {
    if (!selectedRoomId) return;

    addRoomMutation.mutate({
      hallway_id: hallwayId,
      room_id: selectedRoomId,
      position,
      side,
    });

    setSelectedRoomId('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          size="lg"
          className="fixed bottom-6 right-6 shadow-lg z-50 rounded-full h-14 px-6"
        >
          <MapPin className="h-5 w-5 mr-2" />
          Add Room Here
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Quick Room Assignment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Auto-detected position */}
          <div className="p-3 bg-primary/10 rounded-lg">
            <div className="text-sm font-medium mb-1">Detected Position</div>
            <Badge variant="default" className="text-sm">
              {position.toUpperCase()} 
              <span className="ml-2 text-xs opacity-80">
                ({Math.round(currentProgress * 100)}% through route)
              </span>
            </Badge>
          </div>

          {/* Room selector */}
          <div className="space-y-2">
            <Label>Select Room</Label>
            {unassignedRooms.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                All rooms on this floor are already assigned to this hallway.
              </p>
            ) : (
              <Select
                value={selectedRoomId}
                onValueChange={setSelectedRoomId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a room..." />
                </SelectTrigger>
                <SelectContent>
                  {unassignedRooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{room.room_number}</span>
                        <span className="text-muted-foreground">-</span>
                        <span>{room.name}</span>
                        {room.ceiling_height && (
                          <Badge variant="outline" className="text-xs ml-2">
                            {room.ceiling_height === 'high' && '🔺'}
                            {room.ceiling_height === 'double_height' && '🏔️'}
                            {room.ceiling_height === 'standard' && '⬜'}
                          </Badge>
                        )}
                        {room.primary_bulb_type && (
                          <span className="text-xs">
                            {room.primary_bulb_type === 'LED' && '💡'}
                            {room.primary_bulb_type === 'Fluorescent' && '🔆'}
                            {room.primary_bulb_type === 'Mixed' && '🔄'}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Side selector */}
          <div className="space-y-2">
            <Label>Side of Hallway</Label>
            <Select
              value={side}
              onValueChange={(value: 'left' | 'right') => setSide(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">⬅️ Left</SelectItem>
                <SelectItem value="right">➡️ Right</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!selectedRoomId || addRoomMutation.isPending}
              className="flex-1"
            >
              <Plus className="h-4 w-4 mr-2" />
              {addRoomMutation.isPending ? 'Adding...' : 'Add Room'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
