
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RoomSelector } from "./RoomSelector";
import { DateRangePicker } from "./DateRangePicker";
import { useRoomAssignment } from "./hooks/useRoomAssignment";

interface RoomAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedOccupants: string[];
  onSuccess: () => void;
}

export function RoomAssignmentDialog({
  open,
  onOpenChange,
  selectedOccupants,
  onSuccess,
}: RoomAssignmentDialogProps) {
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
    schedule,
    setSchedule,
    notes,
    setNotes,
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

        <Tabs defaultValue="location">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="location">Location</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="location" className="space-y-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
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
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                <DateRangePicker
                  startDate={startDate}
                  endDate={endDate}
                  onStartDateChange={setStartDate}
                  onEndDateChange={setEndDate}
                />
                <div className="space-y-2">
                  <label className="text-sm font-medium">Schedule</label>
                  {/* Add schedule selection component here */}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Notes</label>
                  <textarea
                    className="w-full min-h-[100px] p-2 border rounded-md"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any notes about this assignment..."
                  />
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

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
