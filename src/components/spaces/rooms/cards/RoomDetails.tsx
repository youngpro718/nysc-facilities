
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getStatusColor, getRoomTypeColor, getRoomTypeName } from "../../utils/roomTypeUtils";
import { Room } from "../../rooms/types/RoomTypes";
import { CourtroomPhotos } from "./CourtroomPhotos";

interface RoomDetailsProps {
  room: Room;
}

const RoomDetails: React.FC<RoomDetailsProps> = ({ room }) => {
  return (
    <div className="px-4 py-2">
      <div className="space-y-4">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={getStatusColor(room.status)}>
              {room.status === "under_maintenance" ? "Under Maintenance" : room.status}
            </Badge>
            <Badge variant="outline" className={getRoomTypeColor(room.room_type)}>
              {getRoomTypeName(room.room_type)}
            </Badge>
          </div>
          
          {room.room_number && (
            <div className="text-sm text-muted-foreground">
              Room Number: <span className="font-medium">{room.room_number}</span>
            </div>
          )}

          {room.phone_number && (
            <div className="text-sm text-muted-foreground">
              Phone: <span className="font-medium">{room.phone_number}</span>
            </div>
          )}
        </div>
        
        {room.description && (
          <>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground mb-1">Description:</p>
              <p className="text-sm">{room.description}</p>
            </div>
          </>
        )}
        
        {room.current_function && (
          <>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground mb-1">Current Function:</p>
              <p className="text-sm">{room.current_function}</p>
            </div>
          </>
        )}
        
        {room.room_type === "courtroom" && room.courtroom_photos && (
          <>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground mb-2">Courtroom Photos:</p>
              <CourtroomPhotos photos={room.courtroom_photos} />
            </div>
          </>
        )}

        {room.is_storage && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground mb-1">Storage Information:</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {room.storage_type && (
                  <div>
                    <span className="text-muted-foreground">Type:</span>{" "}
                    <span className="capitalize">{room.storage_type.replace(/_/g, " ")}</span>
                  </div>
                )}
                {room.storage_capacity && (
                  <div>
                    <span className="text-muted-foreground">Capacity:</span>{" "}
                    <span>{room.storage_capacity} cu. ft.</span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RoomDetails;
