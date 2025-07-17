import { EnhancedRoom } from "../../types/EnhancedRoomTypes";
import { LightingStatusBadge } from "../lighting/LightingStatusBadge";
import { OccupancyStatusBadge } from "../occupancy/OccupancyStatusBadge";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  Home, 
  Accessibility,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SmartBadgesProps {
  room: EnhancedRoom;
  className?: string;
}

export function SmartBadges({ room, className }: SmartBadgesProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {/* Smart Status Badges */}
      <div className="flex flex-wrap gap-1.5">
        <LightingStatusBadge roomId={room.id} roomNumber={room.room_number} />
        <OccupancyStatusBadge room={room} />
      </div>
      
      {/* Additional Room Information Badges */}
      <div className="flex flex-wrap gap-1.5">
        <RoomSizeBadge room={room} />
        
        {/* Persistent Issues Alert */}
        {room.has_persistent_issues && <PersistentIssuesBadge room={room} />}
        
        {/* Courtroom Capacity Badge */}
        {room.room_type === 'courtroom' && room.court_room && (
          <CourtroomCapacityBadge courtRoom={room.court_room} />
        )}
        
        {/* Accessibility Badge */}
        {room.room_type === 'courtroom' && room.court_room?.accessibility_features.wheelchair_accessible && (
          <AccessibilityBadge />
        )}
      </div>
    </div>
  );
}

function RoomSizeBadge({ room }: { room: EnhancedRoom }) {
  const sizeCategory = room.room_size_category || 'medium';
  const sizeText = sizeCategory.charAt(0).toUpperCase() + sizeCategory.slice(1);
  
  let bgColor = "bg-slate-500/20 text-slate-700 ring-1 ring-slate-500/30";
  if (sizeCategory === 'large') {
    bgColor = "bg-purple-500/20 text-purple-700 ring-1 ring-purple-500/30";
  } else if (sizeCategory === 'small') {
    bgColor = "bg-orange-500/20 text-orange-700 ring-1 ring-orange-500/30";
  }

  return (
    <Badge variant="outline" className={cn("text-xs flex items-center gap-1", bgColor)}>
      <Home className="h-3 w-3" />
      {sizeText} Room
    </Badge>
  );
}

function PersistentIssuesBadge({ room }: { room: EnhancedRoom }) {
  const issueCount = room.persistent_issues?.open_issues || 0;
  
  return (
    <Badge 
      variant="destructive" 
      className="text-xs flex items-center gap-1 bg-red-500/20 text-red-700 ring-1 ring-red-500/30 animate-pulse"
    >
      <AlertTriangle className="h-3 w-3" />
      {issueCount} Recurring Issues
    </Badge>
  );
}

function CourtroomCapacityBadge({ courtRoom }: { courtRoom: { juror_capacity: number; spectator_capacity: number } }) {
  return (
    <Badge 
      variant="default" 
      className="text-xs flex items-center gap-1 bg-blue-600/20 text-blue-800 ring-1 ring-blue-600/30 font-medium"
    >
      <Users className="h-3 w-3" />
      Seats {courtRoom.juror_capacity} Jurors
    </Badge>
  );
}

function AccessibilityBadge() {
  return (
    <Badge 
      variant="outline" 
      className="text-xs flex items-center gap-1 bg-green-500/20 text-green-700 ring-1 ring-green-500/30"
    >
      <Accessibility className="h-3 w-3" />
      Accessible
    </Badge>
  );
}