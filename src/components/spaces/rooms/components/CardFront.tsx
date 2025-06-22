
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, Trash2, Edit, RotateCcw } from "lucide-react";
import { Room } from "../../types/RoomTypes";
import { EditSpaceDialog } from "../../EditSpaceDialog";
import { StatusEnum } from "../types/roomEnums";

interface CardFrontProps {
  room: Room;
  onFlip: () => void;
  onDelete: (id: string) => void;
}

export function CardFront({ room, onFlip, onDelete }: CardFrontProps) {
  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-2 line-clamp-2">{room.name}</h3>
          <p className="text-sm text-muted-foreground mb-2">
            Room {room.room_number || room.roomNumber}
          </p>
          <Badge variant={room.status === StatusEnum.ACTIVE ? 'default' : 'destructive'}>
            {room.status}
          </Badge>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={onFlip}>
            <RotateCcw className="h-4 w-4" />
          </Button>
          <EditSpaceDialog
            id={room.id}
            type="room"
            onSpaceUpdated={() => console.log('Space updated successfully')}
            initialData={{
              id: room.id,
              name: room.name,
              roomNumber: room.room_number || room.roomNumber || '',
              roomType: room.room_type || room.roomType,
              description: room.description || '',
              status: room.status as StatusEnum,
              floorId: room.floor_id || room.floorId,
              isStorage: room.is_storage || false,
              storageType: room.storage_type || null,
              storageCapacity: room.storage_capacity || null,
              storageNotes: room.storage_notes || null,
              parentRoomId: room.parent_room_id || null,
              currentFunction: room.current_function || null,
              phoneNumber: room.phone_number || null,
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
            variant="ghost"
            size="sm"
            onClick={() => onDelete(room.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div>
          <span className="font-medium">Building:</span>{' '}
          <span className="text-muted-foreground">
            {room.floor?.building?.name || room.buildingName || 'N/A'}
          </span>
        </div>
        <div>
          <span className="font-medium">Floor:</span>{' '}
          <span className="text-muted-foreground">
            {room.floor?.name || room.floorName || 'N/A'}
          </span>
        </div>
        <div>
          <span className="font-medium">Type:</span>{' '}
          <span className="text-muted-foreground">
            {room.room_type || room.roomType}
          </span>
        </div>
        {room.is_storage && (
          <div>
            <span className="font-medium">Storage Type:</span>{' '}
            <span className="text-muted-foreground">
              {room.storage_type || 'General'}
            </span>
          </div>
        )}
      </div>

      {room.description && (
        <div className="mt-4 flex-1">
          <p className="text-sm text-muted-foreground line-clamp-3">
            {room.description}
          </p>
        </div>
      )}
    </div>
  );
}
