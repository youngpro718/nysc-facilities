
import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Building2, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRoomAssignment } from "./hooks/useRoomAssignment";
import { RoomSelectionSection } from "./components/RoomSelectionSection";
import { AssignmentTypeSelection } from "./components/AssignmentTypeSelection";
import { CurrentOccupantsSection } from "./components/CurrentOccupantsSection";
import { useRoomData } from "./hooks/useRoomData";
import { useRoomOccupants } from "./hooks/useRoomOccupants";
import type { AssignRoomsDialogProps } from "./types/assignmentTypes";
import { supabase } from "@/lib/supabase";

export function AssignRoomsDialog({
  open,
  onOpenChange,
  selectedOccupants,
  onSuccess,
}: AssignRoomsDialogProps) {
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [assignmentType, setAssignmentType] = useState<string>("work_location");
  const [isPrimaryAssignment, setIsPrimaryAssignment] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { isAuthenticated } = useAuth();
  const { isAssigning, handleAssignRoom } = useRoomAssignment(onSuccess);
  // Require a real session for data hooks and assigning (RLS). Dev bypass should not flip this.
  const [hasSession, setHasSession] = useState(false);
  const authError = !hasSession;
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (mounted) setHasSession(!!data?.session);
    };
    init();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setHasSession(!!session);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);
  const { data: availableRooms, isLoading: isLoadingRooms } = useRoomData(authError);
  const { data: currentOccupants, isLoading: isLoadingOccupants } = useRoomOccupants(selectedRoom, authError);

  // Memoize the filtered rooms to prevent unnecessary recalculations
  const filteredRooms = useCallback(() => {
    if (!availableRooms) return [];
    const searchStr = searchQuery.toLowerCase();
    return availableRooms.filter(room => (
      room.name.toLowerCase().includes(searchStr) ||
      room.room_number.toLowerCase().includes(searchStr) ||
      room.floors?.name.toLowerCase().includes(searchStr) ||
      room.floors?.buildings?.name.toLowerCase().includes(searchStr)
    ));
  }, [availableRooms, searchQuery]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedRoom("");
      setAssignmentType("work_location");
      setIsPrimaryAssignment(false);
      setSearchQuery("");
    }
  }, [open]);

  const handleAssign = async () => {
    console.log('[AssignRoomsDialog] handleAssign called', {
      selectedRoom,
      selectedOccupants,
      assignmentType,
      isPrimaryAssignment,
      hasSession,
      availableRooms: availableRooms?.length
    });

    // Validate occupants are selected
    if (!selectedOccupants || selectedOccupants.length === 0) {
      console.error('[AssignRoomsDialog] No occupants selected');
      toast.error("Please select at least one occupant first");
      return;
    }

    // Validate room is selected
    if (!selectedRoom) {
      console.error('[AssignRoomsDialog] No room selected');
      toast.error("Please select a room to assign");
      return;
    }

    // Validate session
    if (!hasSession) {
      console.error('[AssignRoomsDialog] No valid session');
      toast.error("You must be signed in to assign rooms");
      return;
    }

    const selectedRoomDetails = availableRooms?.find(r => r.id === selectedRoom);
    console.log('[AssignRoomsDialog] Room details:', selectedRoomDetails);
    
    // Check capacity
    if (selectedRoomDetails?.capacity && 
        selectedRoomDetails.current_occupancy + selectedOccupants.length > selectedRoomDetails.capacity) {
      console.error('[AssignRoomsDialog] Capacity exceeded');
      toast.error(`This assignment would exceed the room's capacity (${selectedRoomDetails.capacity})`);
      return;
    }

    console.log('[AssignRoomsDialog] Calling handleAssignRoom with:', {
      roomId: selectedRoom,
      occupantIds: selectedOccupants,
      type: assignmentType,
      isPrimary: isPrimaryAssignment
    });

    const success = await handleAssignRoom(selectedRoom, selectedOccupants, assignmentType, isPrimaryAssignment);
    console.log('[AssignRoomsDialog] Assignment result:', success);
    
    if (success) {
      console.log('[AssignRoomsDialog] Success - closing dialog');
      onOpenChange(false);
    } else {
      console.error('[AssignRoomsDialog] Assignment failed');
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

        <div className="space-y-6 py-4">
          <RoomSelectionSection
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedRoom={selectedRoom}
            onRoomChange={setSelectedRoom}
            filteredRooms={filteredRooms()}
            isLoadingRooms={isLoadingRooms}
          />

          <AssignmentTypeSelection
            assignmentType={assignmentType}
            onAssignmentTypeChange={setAssignmentType}
            isPrimaryAssignment={isPrimaryAssignment}
            onPrimaryAssignmentChange={setIsPrimaryAssignment}
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
          {authError && (
            <div className="text-sm text-destructive">
              You must be signed in to assign rooms.
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleAssign} 
            disabled={isAssigning || !selectedRoom || authError}
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
