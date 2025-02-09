
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Building, Key } from "lucide-react";
import { OccupantStatus } from "./schemas/occupantSchema";

interface OccupantBulkActionsProps {
  selectedOccupants: string[];
  onUpdateStatus: (status: OccupantStatus) => void;
  onAssignKeys: () => void;
  onAssignRooms: () => void;
}

export function OccupantBulkActions({
  selectedOccupants,
  onUpdateStatus,
  onAssignKeys,
  onAssignRooms,
}: OccupantBulkActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Bulk Actions</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onUpdateStatus("active")}>
            Set Active
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onUpdateStatus("inactive")}>
            Set Inactive
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onUpdateStatus("on_leave")}>
            Set On Leave
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onUpdateStatus("terminated")}>
            Set Terminated
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button variant="outline" onClick={onAssignRooms}>
        <Building className="mr-2 h-4 w-4" />
        Assign Rooms
      </Button>
      <Button variant="outline" onClick={onAssignKeys}>
        <Key className="mr-2 h-4 w-4" />
        Assign Keys
      </Button>
    </div>
  );
}
