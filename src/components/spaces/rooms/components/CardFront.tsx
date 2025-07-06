
import { Room } from "../types/RoomTypes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, ArrowRightFromLine, Users } from "lucide-react";
import { EditSpaceDialog } from "../../EditSpaceDialog";
import { CourtroomPhotos } from './CourtroomPhotos';
import { CourtroomPhotoThumbnail } from './CourtroomPhotoThumbnail';
import { ParentRoomHierarchy } from "../ParentRoomHierarchy";

interface CardFrontProps {
  room: Room;
  onFlip: () => void;
  onDelete: (id: string) => void;
}

export function CardFront({ room, onFlip, onDelete }: CardFrontProps) {
  return (
    <div className="p-5 flex flex-col h-full">
      <div className="mb-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{room.name}</h3>
            <p className="text-sm text-muted-foreground">Room {room.room_number}</p>
          </div>
          <Badge 
            variant={
              room.status === 'active' ? 'default' :
              room.status === 'inactive' ? 'destructive' : 'outline'
            }
            className="ml-2"
          >
            {room.status.split('_').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ')}
          </Badge>
        </div>
        
        <div className="flex items-center mt-1">
          <Badge 
            variant="secondary" 
            className="text-xs"
          >
            {room.room_type.replace(/_/g, ' ')}
          </Badge>
          
          {room.is_storage && (
            <Badge 
              variant="secondary" 
              className="ml-2 text-xs"
            >
              Storage
            </Badge>
          )}
        </div>
        
        {/* Parent-Child Hierarchy Info */}
        <div className="mt-2">
          <ParentRoomHierarchy roomId={room.id} compact={true} />
        </div>
        
        {/* Show photo thumbnail on card if room is a courtroom and has photos */}
        {room.room_type === 'courtroom' && (
          <CourtroomPhotoThumbnail photos={room.courtroom_photos} />
        )}
        
        {/* Display CourtroomPhotos dialog component if room is a courtroom */}
        {room.room_type === 'courtroom' && <CourtroomPhotos room={room} />}
      </div>

      <div className="flex-1">
        {room.description ? (
          <p className="text-sm text-muted-foreground line-clamp-5">
            {room.description}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            No description available
          </p>
        )}

        {/* Occupants Preview */}
        {room.current_occupants && room.current_occupants.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center mb-1">
              <Users className="h-4 w-4 mr-1 text-muted-foreground" />
              <span className="text-sm font-medium">Occupants</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {room.current_occupants.slice(0, 2).map((occupant, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {occupant.first_name} {occupant.last_name}
                </Badge>
              ))}
              {room.current_occupants.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{room.current_occupants.length - 2} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-between">
        <Button variant="ghost" size="sm" onClick={onFlip}>
          <ArrowRightFromLine className="h-4 w-4 mr-1" />
          More Details
        </Button>
        <div className="flex gap-2">
          <EditSpaceDialog
            id={room.id}
            type="room"
            initialData={{
              id: room.id,
              name: room.name,
              roomNumber: room.room_number || '',
              roomType: room.room_type,
              description: room.description || '',
              status: room.status,
              floorId: room.floor_id,
              isStorage: room.is_storage || false,
              storageType: room.storage_type || null,
              storageCapacity: room.storage_capacity || null,
              storageNotes: room.storage_notes || null,
              parentRoomId: room.parent_room_id || null,
              currentFunction: room.current_function || null,
              phoneNumber: room.phone_number || null,
              courtroom_photos: room.courtroom_photos || null,
              connections: room.space_connections?.map(conn => ({
                id: conn.id,
                connectionType: conn.connection_type,
                toSpaceId: conn.to_space_id,
                direction: conn.direction || null
              })) || [],
              type: "room"
            }}
          />
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(room.id)}
            title="Delete Room"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
