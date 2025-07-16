import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const [isCreating, setIsCreating] = useState(false);

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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Room Assignment</DialogTitle>
          <DialogDescription>
            Assign an occupant to a room with specific details.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
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
          <Button onClick={handleCreate} disabled={isCreating}>
            {isCreating ? "Creating..." : "Create Assignment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}