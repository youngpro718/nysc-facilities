
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RoomSelector } from "./assign-rooms/RoomSelector";
import { DateRangePicker } from "./assign-rooms/DateRangePicker";
import { CurrentOccupants } from "./assign-rooms/CurrentOccupants";
import { useRoomAssignment } from "./assign-rooms/hooks/useRoomAssignment";

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
  const {
    selectedRoom,
    setSelectedRoom,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    assignmentType,
    setAssignmentType,
    isPrimary,
    setIsPrimary,
    isAssigning,
    availableRooms,
    currentOccupants,
    handleAssign
  } = useRoomAssignment(selectedOccupants);

  const handleSubmit = async () => {
    await handleAssign(() => {
      onSuccess();
      onOpenChange(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Assign Rooms to Selected Occupants</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <RoomSelector
            selectedRoom={selectedRoom}
            onRoomSelect={setSelectedRoom}
            availableRooms={availableRooms}
            assignmentType={assignmentType}
            onAssignmentTypeChange={setAssignmentType}
            isPrimary={isPrimary}
            onIsPrimaryChange={setIsPrimary}
            currentOccupants={currentOccupants}
          />

          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
          />

          <CurrentOccupants occupants={currentOccupants} />

          <div className="text-sm text-muted-foreground">
            Selected occupants: {selectedOccupants.length}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isAssigning || !selectedRoom || !startDate}
          >
            {isAssigning ? "Assigning..." : "Submit for Approval"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
