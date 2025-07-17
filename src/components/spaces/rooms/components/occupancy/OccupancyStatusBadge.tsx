import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, UserCheck, UserX } from "lucide-react";
import { EnhancedRoom } from "../../types/EnhancedRoomTypes";

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

  // For courtrooms, show juror capacity if available
  if (room.room_type === 'courtroom' && room.court_room?.juror_capacity) {
    const currentOccupants = room.current_occupants?.length || 0;
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-auto p-1 hover:bg-accent/50"
        onClick={onClick}
      >
        <Badge 
          variant={status.variant}
          className="flex items-center gap-1 cursor-pointer hover:scale-105 transition-transform"
        >
          <Icon className="h-3 w-3" />
          <span className="text-xs">
            {currentOccupants}/{room.court_room.juror_capacity} Jurors
          </span>
        </Badge>
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-auto p-1 hover:bg-accent/50"
      onClick={onClick}
    >
      <Badge 
        variant={status.variant}
        className="flex items-center gap-1 cursor-pointer hover:scale-105 transition-transform"
      >
        <Icon className="h-3 w-3" />
        <span className="text-xs">{status.text}</span>
      </Badge>
    </Button>
  );
}