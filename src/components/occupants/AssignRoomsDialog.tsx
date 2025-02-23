
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Loader2 } from "lucide-react";
import { useAuthCheck } from "./hooks/useAuthCheck";
import { useRoomAssignment } from "./hooks/useRoomAssignment";
import { RoomSelectionSection } from "./components/RoomSelectionSection";
import { CurrentOccupantsSection } from "./components/CurrentOccupantsSection";

interface AssignRoomsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedOccupants: string[];
  onSuccess: () => void;
}

interface RoomDetails {
  id: string;
  name: string;
  room_number: string;
  capacity: number | null;
  current_occupancy: number;
  floors: {
    name: string;
    buildings: {
      name: string;
    };
  } | null;
}

export function AssignRoomsDialog({
  open,
  onOpenChange,
  selectedOccupants,
  onSuccess,
}: AssignRoomsDialogProps) {
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [isPrimaryAssignment, setIsPrimaryAssignment] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { authError, checkAuth } = useAuthCheck(open);
  const { isAssigning, handleAssignRoom } = useRoomAssignment(onSuccess);

  const { data: availableRooms, isLoading: isLoadingRooms } = useQuery({
    queryKey: ["available-rooms"],
    enabled: !authError,
    queryFn: async () => {
      console.log("Fetching rooms data...");
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("No active session");
      }
      
      const { data: roomsData, error: roomsError } = await supabase
        .from("rooms")
        .select(`
          id,
          name,
          room_number,
          capacity,
          current_occupancy,
          floors (
            name,
            buildings (
              name
            )
          )
        `)
        .eq("status", "active")
        .order("name");

      if (roomsError) {
        console.error('Error fetching rooms:', roomsError);
        throw roomsError;
      }

      console.log('Available rooms fetched:', roomsData);
      return roomsData as RoomDetails[];
    },
  });

  const { data: currentOccupants, isLoading: isLoadingOccupants } = useQuery({
    queryKey: ["room-occupants", selectedRoom],
    enabled: !!selectedRoom && !authError,
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("No active session");
      }

      const { data: occupantsData, error } = await supabase
        .from("occupant_room_assignments")
        .select(`
          is_primary,
          occupants!fk_occupant_room_assignments_occupant (
            id,
            first_name,
            last_name
          )
        `)
        .eq("room_id", selectedRoom);

      if (error) {
        console.error('Error fetching room occupants:', error);
        throw error;
      }
      
      if (!occupantsData) {
        console.log('No occupants data found');
        return [];
      }

      const mappedOccupants = occupantsData
        .filter(assignment => assignment.occupants)
        .map(assignment => ({
          id: assignment.occupants.id,
          first_name: assignment.occupants.first_name,
          last_name: assignment.occupants.last_name,
          is_primary: assignment.is_primary
        }));

      console.log('Current occupants:', mappedOccupants);
      return mappedOccupants;
    }
  });

  const filteredRooms = availableRooms?.filter(room => {
    const searchStr = searchQuery.toLowerCase();
    return (
      room.name.toLowerCase().includes(searchStr) ||
      room.room_number.toLowerCase().includes(searchStr) ||
      room.floors?.name.toLowerCase().includes(searchStr) ||
      room.floors?.buildings?.name.toLowerCase().includes(searchStr)
    );
  }) || [];

  const handleAssign = async () => {
    const selectedRoomDetails = availableRooms?.find(r => r.id === selectedRoom);
    
    if (selectedRoomDetails?.capacity && 
        selectedRoomDetails.current_occupancy + selectedOccupants.length > selectedRoomDetails.capacity) {
      toast.error("This assignment would exceed the room's capacity");
      return;
    }

    const success = await handleAssignRoom(selectedRoom, selectedOccupants, isPrimaryAssignment);
    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Assign Room{selectedOccupants.length > 1 ? 's' : ''} to {selectedOccupants.length} Occupant{selectedOccupants.length > 1 ? 's' : ''}
          </DialogTitle>
        </DialogHeader>

        {authError ? (
          <div className="p-4 text-center">
            <p className="text-destructive">{authError}</p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline" 
              className="mt-4"
            >
              Refresh Page
            </Button>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <RoomSelectionSection
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedRoom={selectedRoom}
              onRoomChange={setSelectedRoom}
              filteredRooms={filteredRooms}
              isLoadingRooms={isLoadingRooms}
            />

            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Primary Assignment</label>
              <Select
                value={isPrimaryAssignment ? "yes" : "no"}
                onValueChange={(value) => setIsPrimaryAssignment(value === "yes")}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <CurrentOccupantsSection
              selectedRoom={selectedRoom}
              currentOccupants={currentOccupants}
              isLoadingOccupants={isLoadingOccupants}
            />

            <div className="text-sm text-muted-foreground">
              Selected occupants: {selectedOccupants.length}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleAssign} 
            disabled={isAssigning || !selectedRoom || !!authError}
          >
            {isAssigning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Assigning...
              </>
            ) : (
              <>
                <Building2 className="mr-2 h-4 w-4" />
                Assign Room{selectedOccupants.length > 1 ? 's' : ''}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

