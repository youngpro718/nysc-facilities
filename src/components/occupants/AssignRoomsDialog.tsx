
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Building2, Loader2 } from "lucide-react";
import { useAuthCheck } from "./hooks/useAuthCheck";
import { useRoomAssignment } from "./hooks/useRoomAssignment";
import { RoomSelectionSection } from "./components/RoomSelectionSection";
import { CurrentOccupantsSection } from "./components/CurrentOccupantsSection";
import { useRoomData } from "./hooks/useRoomData";
import { useRoomOccupants } from "./hooks/useRoomOccupants";
import type { AssignRoomsDialogProps } from "./types/assignmentTypes";

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
  
  const { data: availableRooms, isLoading: isLoadingRooms } = useRoomData(authError);
  const { data: currentOccupants, isLoading: isLoadingOccupants } = useRoomOccupants(selectedRoom, authError);

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

            <CurrentOccupantsSection
              selectedRoom={selectedRoom}
              currentOccupants={currentOccupants}
              isLoadingOccupants={isLoadingOccupants}
              isPrimaryAssignment={isPrimaryAssignment}
              onPrimaryAssignmentChange={setIsPrimaryAssignment}
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
