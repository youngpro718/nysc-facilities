import { Button } from "@/components/ui/button";
import { Plus, MapPin } from "lucide-react";
import { OccupantBulkActions } from "./OccupantBulkActions";
import { useNavigate } from "react-router-dom";
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
  onCreateOccupant
}: OccupantHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold">Occupants</h1>
        <p className="text-muted-foreground">Manage occupant profiles and room assignments</p>
      </div>
      <div className="flex items-center gap-3">
        <Button 
          variant="outline" 
          onClick={() => navigate('/occupants/room-assignments')}
        >
          <MapPin className="mr-2 h-4 w-4" />
          Room Assignments
        </Button>
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