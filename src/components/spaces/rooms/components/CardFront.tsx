
import { Room } from "../types/RoomTypes";
import { EnhancedRoom } from "../types/EnhancedRoomTypes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2, ArrowRightFromLine, Users, Shield, Lightbulb } from "lucide-react";
import { EditSpaceDialog } from "../../EditSpaceDialog";
import { CourtroomPhotos } from './CourtroomPhotos';
import { CourtroomPhotoThumbnail } from './CourtroomPhotoThumbnail';
import { ParentRoomHierarchy } from "../ParentRoomHierarchy";
import { RoomAccessSummary } from "@/components/access/RoomAccessSummary";
import { SmartBadges } from "./badges/SmartBadges";
import { LightingReportDialog } from "./lighting/LightingReportDialog";

interface CardFrontProps {
  room: EnhancedRoom;
  onFlip: (e?: React.MouseEvent) => void;
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

        {/* Smart Badges Section */}
        <div className="mt-3">
          <SmartBadges room={room} />
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
        
        {/* Mobile-friendly inventory button for storage rooms */}
        {room.is_storage && (
          <div className="mt-2 md:hidden">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full flex items-center gap-2"
              onClick={(e) => {
                e.stopPropagation();
                const event = new CustomEvent('openInventoryDialog', { 
                  detail: { roomId: room.id, roomName: room.name } 
                });
                window.dispatchEvent(event);
              }}
            >
              <Badge variant="secondary" className="text-xs">
                Inventory
              </Badge>
            </Button>
          </div>
        )}
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
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onFlip}
            className="hidden md:flex"
          >
            <ArrowRightFromLine className="h-4 w-4 mr-1" />
            More Details
          </Button>
          
          {/* Quick Report Light Out Button */}
          <LightingReportDialog
            room={room}
            trigger={
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
              >
                <Lightbulb className="h-4 w-4" />
                Report Light Out
              </Button>
            }
          />
        </div>
        <div className="flex gap-2">
          {/* Who Has Access Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                title="Who Has Access"
              >
                <Shield className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Room Access - {room.name}</DialogTitle>
              </DialogHeader>
              <RoomAccessSummary roomId={room.id} />
            </DialogContent>
          </Dialog>

          <EditSpaceDialog
            id={room.id}
            type="room"
            initialData={{
              id: room.id,
              name: room.name,
              room_number: room.room_number || '',
              room_type: room.room_type,
              description: room.description || '',
              status: room.status,
              floor_id: room.floor_id,
              is_storage: room.is_storage || false,
              storage_type: room.storage_type || null,
              storage_capacity: room.storage_capacity || null,
              storage_notes: room.storage_notes || null,
              parent_room_id: room.parent_room_id || null,
              current_function: room.current_function || null,
              phone_number: room.phone_number || null,
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
