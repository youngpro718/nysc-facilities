import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, UserCheck, UserX, Info, Pencil } from "lucide-react";
import { EnhancedRoom } from "../../types/EnhancedRoomTypes";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { ModalFrame } from "@/components/common/ModalFrame";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { EditSpaceDialog } from "../../../EditSpaceDialog";

interface OccupancyStatusBadgeProps {
  room: EnhancedRoom;
  onClick?: () => void;
}

export function OccupancyStatusBadge({ room, onClick }: OccupancyStatusBadgeProps) {
  const getOccupancyStatus = () => {
    if (room.vacancy_status === 'at_capacity') {
      return { text: 'At Capacity', variant: 'destructive' as const, icon: UserX };
    }
    if (room.vacancy_status === 'occupied') {
      return { text: 'Occupied', variant: 'secondary' as const, icon: UserCheck };
    }
    return { text: 'Vacant', variant: 'default' as const, icon: Users };
  };

  const status = getOccupancyStatus();
  const Icon = status.icon;

  const badge = (
    <Badge 
      variant={status.variant}
      className="flex items-center gap-1 cursor-pointer hover:scale-105 transition-transform"
    >
      <Icon className="h-3 w-3" />
      <span className="text-xs">{status.text}</span>
    </Badge>
  );

  // For courtrooms, show juror capacity if available
  if (room.room_type === 'courtroom' && room.court_room?.juror_capacity) {
    const currentOccupants = room.current_occupants?.length || 0;
    const courtBadge = (
      <Badge 
        variant={status.variant}
        className="flex items-center gap-1 cursor-pointer hover:scale-105 transition-transform"
      >
        <Icon className="h-3 w-3" />
        <span className="text-xs">
          {currentOccupants}/{room.court_room.juror_capacity} Jurors
        </span>
      </Badge>
    );
    return (
      <Dialog>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-auto p-1 hover:bg-accent/50">
                  {courtBadge}
                </Button>
              </DialogTrigger>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-xs">
              Juror seats used vs. capacity. Click to see how this is calculated and edit.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <ModalFrame
          title={
            <span className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              Occupancy status
            </span>
          }
          size="md"
        >
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span>Current occupants</span>
              <span className="font-medium">{currentOccupants}</span>
            </div>
            <div className="flex justify-between">
              <span>Juror capacity</span>
              <span className="font-medium">{room.court_room.juror_capacity}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Adjust the capacity or room usage in the edit screen if this label doesn’t match reality.
            </p>
            <div className="pt-2 flex justify-end">
              <EditSpaceDialog id={room.id} type="room" variant="custom" initialData={room}>
                <Button size="sm" variant="outline" className="flex items-center gap-2">
                  <Pencil className="h-4 w-4" />
                  Edit capacity & usage
                </Button>
              </EditSpaceDialog>
            </div>
          </div>
        </ModalFrame>
      </Dialog>
    );
  }

  return (
    <Dialog>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-auto p-1 hover:bg-accent/50" onClick={onClick}>
                {badge}
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs text-xs">
            Indicates whether the room is vacant, occupied, or at capacity. Click for details.
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <ModalFrame
        title={
          <span className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Occupancy status
          </span>
        }
        size="md"
      >
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span>Current occupants</span>
            <span className="font-medium">{room.current_occupants?.length || 0}</span>
          </div>
          <div className="flex justify-between">
            <span>Configured capacity</span>
            <span className="font-medium">{room.court_room?.juror_capacity ?? '—'}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            You can change capacity or update room usage from the edit screen.
          </p>
          <div className="pt-2 flex justify-end">
            <EditSpaceDialog id={room.id} type="room" variant="custom" initialData={room}>
              <Button size="sm" variant="outline" className="flex items-center gap-2">
                <Pencil className="h-4 w-4" />
                Edit capacity & usage
              </Button>
            </EditSpaceDialog>
          </div>
        </div>
      </ModalFrame>
    </Dialog>
  );
}