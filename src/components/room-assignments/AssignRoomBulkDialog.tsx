import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

interface AssignRoomBulkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AssignRoomBulkDialog({
  open,
  onOpenChange,
  onSuccess,
}: AssignRoomBulkDialogProps) {
  const [selectedOccupants, setSelectedOccupants] = useState<string[]>([]);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [assignmentType, setAssignmentType] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [schedule, setSchedule] = useState("");
  const [notes, setNotes] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  // Fetch occupants
  const { data: occupants } = useQuery({
    queryKey: ["occupants-for-bulk-assign"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("occupants")
        .select("id, first_name, last_name, email, department")
        .eq("status", "active")
        .order("first_name");

      if (error) throw error;
      return data;
    },
  });

  // Fetch rooms
  const { data: rooms } = useQuery({
    queryKey: ["rooms-for-bulk-assign"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select(`
          id, 
          room_number, 
          name,
          floors (
            name,
            buildings (
              name
            )
          )
        `)
        .eq("status", "active")
        .order("room_number");

      if (error) throw error;
      return data;
    },
  });

  const handleAssign = async () => {
    if (!selectedRoom || !assignmentType || selectedOccupants.length === 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsAssigning(true);

    try {
      // Create assignments for all selected occupants
      const assignments = selectedOccupants.map(occupantId => ({
        occupant_id: occupantId,
        room_id: selectedRoom,
        assignment_type: assignmentType,
        is_primary: isPrimary,
        assigned_at: new Date().toISOString(),
        schedule: schedule.trim() || null,
        notes: notes.trim() || null,
      }));

      const { error } = await supabase
        .from("occupant_room_assignments")
        .insert(assignments);

      if (error) throw error;

      toast.success(`Successfully assigned ${selectedOccupants.length} occupants to room`);
      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setSelectedOccupants([]);
      setSelectedRoom("");
      setAssignmentType("");
      setIsPrimary(false);
      setSchedule("");
      setNotes("");
    } catch (error) {
      console.error("Error creating bulk assignments:", error);
      toast.error("Failed to create assignments");
    } finally {
      setIsAssigning(false);
    }
  };

  const toggleOccupant = (occupantId: string) => {
    setSelectedOccupants(prev =>
      prev.includes(occupantId)
        ? prev.filter(id => id !== occupantId)
        : [...prev, occupantId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Room Assignment</DialogTitle>
          <DialogDescription>
            Assign multiple occupants to a room at once
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Select Occupants */}
          <div className="space-y-3">
            <Label>Select Occupants ({selectedOccupants.length} selected)</Label>
            <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
              {occupants?.map((occupant) => (
                <div key={occupant.id} className="flex items-center space-x-2 py-2">
                  <Checkbox
                    checked={selectedOccupants.includes(occupant.id)}
                    onCheckedChange={() => toggleOccupant(occupant.id)}
                  />
                  <div className="flex-1">
                    <div className="font-medium">
                      {occupant.first_name} {occupant.last_name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {occupant.email} • {occupant.department}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Select Room */}
          <div className="space-y-2">
            <Label>Room</Label>
            <Select value={selectedRoom} onValueChange={setSelectedRoom}>
              <SelectTrigger>
                <SelectValue placeholder="Select a room" />
              </SelectTrigger>
              <SelectContent>
                {rooms?.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    {room.room_number} - {room.name}
                    {room.floors && (
                      <span className="text-muted-foreground">
                        {" "} ({room.floors.buildings?.name}, {room.floors.name})
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Assignment Type */}
          <div className="space-y-2">
            <Label>Assignment Type</Label>
            <Select value={assignmentType} onValueChange={setAssignmentType}>
              <SelectTrigger>
                <SelectValue placeholder="Select assignment type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="primary_office">Primary Office</SelectItem>
                <SelectItem value="secondary_office">Secondary Office</SelectItem>
                <SelectItem value="storage">Storage</SelectItem>
                <SelectItem value="shared_workspace">Shared Workspace</SelectItem>
                <SelectItem value="temporary">Temporary</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Primary Assignment */}
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={isPrimary}
              onCheckedChange={(checked) => setIsPrimary(checked === true)}
            />
            <Label>Make this a primary assignment</Label>
          </div>

          {/* Schedule */}
          <div className="space-y-2">
            <Label>Schedule (Optional)</Label>
            <Input
              placeholder="e.g., Mon-Fri 9AM-5PM"
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              placeholder="Additional notes about the assignment"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={isAssigning}>
              {isAssigning ? "Assigning..." : "Assign Room"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}