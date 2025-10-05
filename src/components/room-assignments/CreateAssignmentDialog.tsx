import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, Plus, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ConflictDetectionAlert, type AssignmentConflict } from './ConflictDetectionAlert';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface CreateAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateAssignmentDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateAssignmentDialogProps) {
  const [selectedOccupant, setSelectedOccupant] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");
  const [assignmentType, setAssignmentType] = useState("work_location");
  const [isPrimary, setIsPrimary] = useState(false);
  const [schedule, setSchedule] = useState("");
  const [notes, setNotes] = useState("");
  const [expirationDate, setExpirationDate] = useState<Date>();
  const [isCreating, setIsCreating] = useState(false);
  const [conflicts, setConflicts] = useState<AssignmentConflict[]>([]);

  // Check for conflicts when form data changes
  const checkConflicts = async () => {
    const newConflicts: AssignmentConflict[] = [];

    // Check for primary office conflicts
    if (assignmentType === 'work_location' && isPrimary && selectedOccupant) {
      try {
        const { data: existingPrimary } = await supabase
          .from('occupant_room_assignments')
          .select('id')
          .eq('occupant_id', selectedOccupant)
          .eq('assignment_type', 'work_location')
          .eq('is_primary', true);

        if (existingPrimary && existingPrimary.length > 0) {
          newConflicts.push({
            type: 'primary_office',
            message: 'This occupant already has a primary work location assigned',
            severity: 'error',
            details: 'Each occupant can only have one primary work location. Please remove the existing primary assignment first.'
          });
        }
      } catch (error) {
        console.error('Error checking primary office conflicts:', error);
      }
    }

    // Check room capacity (if available)
    if (selectedRoom) {
      try {
        const { data: room } = await supabase
          .from('rooms')
          .select('current_occupancy, capacity')
          .eq('id', selectedRoom)
          .single();

        if (room && room.capacity && room.current_occupancy >= room.capacity) {
          newConflicts.push({
            type: 'room_capacity',
            message: 'Room is at full capacity',
            severity: 'warning',
            details: `This room can accommodate ${room.capacity} occupants and currently has ${room.current_occupancy}.`
          });
        }
      } catch (error) {
        console.error('Error checking room capacity:', error);
      }
    }

    setConflicts(newConflicts);
  };

  // Check conflicts when key fields change
  React.useEffect(() => {
    if (selectedOccupant && selectedRoom && assignmentType) {
      checkConflicts();
    }
  }, [selectedOccupant, selectedRoom, assignmentType, isPrimary]);

  // Fetch occupants
  const { data: occupants } = useQuery({
    queryKey: ["occupants-for-assignment"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("occupants")
        .select("id, first_name, last_name, email, department")
        .eq("status", "active")
        .order("last_name");

      if (error) throw error;
      return data;
    },
  });

  // Fetch rooms
  const { data: rooms } = useQuery({
    queryKey: ["rooms-for-assignment"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select(`
          id,
          name,
          room_number,
          floors (
            name,
            buildings (
              name
            )
          )
        `)
        .order("room_number");

      if (error) throw error;
      return data;
    },
  });

  const handleCreate = async () => {
    // Block submission if there are error conflicts
    const errorConflicts = conflicts.filter(c => c.severity === 'error');
    if (errorConflicts.length > 0) {
      return;
    }

    if (!selectedOccupant || !selectedRoom) {
      toast.error("Please select both occupant and room");
      return;
    }

    setIsCreating(true);
    try {
      const { error } = await supabase
        .from("occupant_room_assignments")
        .insert({
          occupant_id: selectedOccupant,
          room_id: selectedRoom,
          assignment_type: assignmentType,
          is_primary: isPrimary,
          schedule: schedule.trim() || null,
          notes: notes.trim() || null,
          expiration_date: expirationDate?.toISOString() || null,
        });

      if (error) throw error;

      toast.success("Assignment created successfully");
      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setSelectedOccupant("");
      setSelectedRoom("");
      setAssignmentType("work_location");
      setIsPrimary(false);
      setSchedule("");
      setNotes("");
      setExpirationDate(undefined);
      setConflicts([]);
    } catch (error) {
      console.error("Error creating assignment:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to create assignment";
      toast.error(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Room Assignment</DialogTitle>
          <DialogDescription>
            Assign an occupant to a room with specific details.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Conflict Detection */}
          {conflicts.length > 0 && (
            <ConflictDetectionAlert conflicts={conflicts} />
          )}

          <div className="space-y-2">
            <Label htmlFor="occupant">Occupant</Label>
            <Select value={selectedOccupant} onValueChange={setSelectedOccupant}>
              <SelectTrigger>
                <SelectValue placeholder="Select occupant" />
              </SelectTrigger>
              <SelectContent>
                {occupants?.map((occupant) => (
                  <SelectItem key={occupant.id} value={occupant.id}>
                    {occupant.first_name} {occupant.last_name} ({occupant.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="room">Room</Label>
            <Select value={selectedRoom} onValueChange={setSelectedRoom}>
              <SelectTrigger>
                <SelectValue placeholder="Select room" />
              </SelectTrigger>
              <SelectContent>
                {rooms?.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    {room.room_number} - {room.name} 
                    ({(room as any)?.floors?.buildings?.name} - {(room as any)?.floors?.name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignment-type">Assignment Type</Label>
            <Select value={assignmentType} onValueChange={setAssignmentType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="work_location">Work Location</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              checked={isPrimary}
              onCheckedChange={(checked) => setIsPrimary(checked === true)}
            />
            <Label className="text-sm font-medium">Primary assignment</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="schedule">Schedule</Label>
            <Input
              id="schedule"
              placeholder="e.g., Monday-Friday 9AM-5PM"
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiration-date">Expiration Date (optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !expirationDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {expirationDate ? format(expirationDate, 'PPP') : 'No expiration'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={expirationDate}
                  onSelect={setExpirationDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes or comments"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreate} 
            disabled={!selectedOccupant || !selectedRoom || isCreating || conflicts.some(c => c.severity === 'error')}
          >
            {isCreating ? "Creating..." : "Create Assignment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}