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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { RoomAssignmentWithDetails } from "./hooks/useRoomAssignmentsList";

interface ReassignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: RoomAssignmentWithDetails | null;
  onSuccess: () => void;
}

export function ReassignmentDialog({
  open,
  onOpenChange,
  assignment,
  onSuccess,
}: ReassignmentDialogProps) {
  const [newOccupant, setNewOccupant] = useState("");
  const [newRoom, setNewRoom] = useState("");
  const [isReassigning, setIsReassigning] = useState(false);

  // Fetch occupants
  const { data: occupants } = useQuery({
    queryKey: ["occupants-for-reassignment"],
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
    queryKey: ["rooms-for-reassignment"],
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

  const handleReassign = async () => {
    if (!assignment) return;
    
    if (!newOccupant && !newRoom) {
      toast.error("Please select either a new occupant or a new room");
      return;
    }

    setIsReassigning(true);
    try {
      const updates: any = {};
      
      if (newOccupant) {
        updates.occupant_id = newOccupant;
      }
      
      if (newRoom) {
        updates.room_id = newRoom;
      }

      const { error } = await supabase
        .from("occupant_room_assignments")
        .update(updates)
        .eq("id", assignment.id);

      if (error) throw error;

      toast.success("Assignment reassigned successfully");
      onSuccess();
      onOpenChange(false);
      setNewOccupant("");
      setNewRoom("");
    } catch (error) {
      console.error("Error reassigning:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to reassign";
      toast.error(errorMessage);
    } finally {
      setIsReassigning(false);
    }
  };

  if (!assignment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reassign Assignment</DialogTitle>
          <DialogDescription>
            Change the occupant or room for this assignment.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-sm font-medium">Current Assignment</div>
            <div className="text-sm text-muted-foreground">
              {assignment.occupant_name} → {assignment.room_number} ({assignment.room_name})
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-occupant">New Occupant (optional)</Label>
            <Select value={newOccupant} onValueChange={setNewOccupant}>
              <SelectTrigger>
                <SelectValue placeholder="Keep current occupant" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="keep-current">Keep current occupant</SelectItem>
                {occupants?.map((occupant) => (
                  <SelectItem key={occupant.id} value={occupant.id}>
                    {occupant.first_name} {occupant.last_name} ({occupant.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-room">New Room (optional)</Label>
            <Select value={newRoom} onValueChange={setNewRoom}>
              <SelectTrigger>
                <SelectValue placeholder="Keep current room" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="keep-current">Keep current room</SelectItem>
                {rooms?.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    {room.room_number} - {room.name} 
                    ({(room as any)?.floors?.buildings?.name} - {(room as any)?.floors?.name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleReassign} disabled={isReassigning}>
            {isReassigning ? "Reassigning..." : "Reassign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}