import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface AssignRoomsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedOccupants: string[];
  onSuccess: () => void;
}

export function AssignRoomsDialog({
  open,
  onOpenChange,
  selectedOccupants,
  onSuccess,
}: AssignRoomsDialogProps) {
  const [selectedRoom, setSelectedRoom] = useState<string>("");

  const { data: availableRooms } = useQuery({
    queryKey: ["available-rooms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("*, floors(name, buildings(name))")
        .eq("status", "active");

      if (error) throw error;
      return data;
    },
  });

  const handleAssign = async () => {
    if (!selectedRoom) {
      toast.error("Please select a room to assign");
      return;
    }

    try {
      // Create assignments for each selected occupant
      const assignments = selectedOccupants.map((occupantId) => ({
        occupant_id: occupantId,
        room_id: selectedRoom,
        assigned_at: new Date().toISOString(),
      }));

      // Insert assignments
      const { error: assignmentError } = await supabase
        .from("occupant_room_assignments")
        .insert(assignments);

      if (assignmentError) throw assignmentError;

      toast.success("Rooms assigned successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Rooms to Selected Occupants</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Room</label>
            <Select
              value={selectedRoom}
              onValueChange={setSelectedRoom}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a room" />
              </SelectTrigger>
              <SelectContent>
                {availableRooms?.map((room) => (
                  <SelectItem 
                    key={room.id} 
                    value={room.id}
                  >
                    {room.name} - {room.floors?.name}, {room.floors?.buildings?.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-muted-foreground">
            Selected occupants: {selectedOccupants.length}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAssign}>
            Assign Rooms
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}