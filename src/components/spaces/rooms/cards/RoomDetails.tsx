
import { Button } from "@/components/ui/button";
import { Room } from "../../types/RoomTypes";
import { getStatusColor, getRoomTypeIcon } from "../../utils/roomTypeUtils";
import { Badge } from "@/components/ui/badge";
import { CourtroomPhotos } from "./CourtroomPhotos";

interface RoomDetailsProps {
  room: Room;
}

export function RoomDetails({ room }: RoomDetailsProps) {
  const statusColor = getStatusColor(room.status);
  const RoomTypeIcon = getRoomTypeIcon(room.roomType);

  return (
    <div className="space-y-2">
      {/* Room Header */}
      <div className="flex items-center gap-2">
        <RoomTypeIcon className="w-5 h-5" />
        <h3 className="text-lg font-medium">{room.name}</h3>
      </div>

      {/* Room Info */}
      <div className="space-y-1">
        {room.roomNumber && (
          <p className="text-sm text-muted-foreground">
            Room number: <span className="font-medium">{room.roomNumber}</span>
          </p>
        )}
        
        <div className="flex flex-wrap gap-1 mt-1">
          <Badge variant="outline" className={`bg-${statusColor}-50 text-${statusColor}-700 border-${statusColor}-200`}>
            {room.status}
          </Badge>
          <Badge variant="outline">
            {room.roomType}
          </Badge>
        </div>
        
        {room.currentFunction && (
          <p className="text-sm mt-2">
            <span className="text-muted-foreground">Function: </span>
            {room.currentFunction}
          </p>
        )}
        
        {room.description && (
          <p className="text-sm mt-2 line-clamp-3">
            {room.description}
          </p>
        )}
        
        {/* Courtroom Photos (only for courtrooms) */}
        {room.roomType === 'courtroom' && room.courtRoomPhotos && (
          <CourtroomPhotos photos={room.courtRoomPhotos} />
        )}
      </div>
    </div>
  );
}
