import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { OccupantBulkActions } from "./OccupantBulkActions";

interface OccupantHeaderProps {
  selectedOccupants: string[];
  onBulkStatusUpdate: (status: string) => void;
  onAssignKeys: () => void;
  onAssignRooms: () => void;
  onCreateOccupant: () => void;
}

export function OccupantHeader({
  selectedOccupants,
  onBulkStatusUpdate,
  onAssignKeys,
  onAssignRooms,
  onCreateOccupant,
}: OccupantHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold">Occupants</h1>
      <div className="flex items-center gap-4">
        {selectedOccupants.length > 0 && (
          <OccupantBulkActions
            selectedOccupants={selectedOccupants}
            onUpdateStatus={onBulkStatusUpdate}
            onAssignKeys={onAssignKeys}
            onAssignRooms={onAssignRooms}
          />
        )}
        <Button onClick={onCreateOccupant}>
          <Plus className="mr-2 h-4 w-4" />
          Add Occupant
        </Button>
      </div>
    </div>
  );
}