import { Room } from "./types/RoomTypes";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Phone, MapPin, Users, ArrowRightLeft, Lightbulb } from "lucide-react";
import { EditSpaceDialog } from "../EditSpaceDialog";
import { format } from "date-fns";

export interface RoomCardProps {
  room: Room;
  onDelete: (id: string) => void;
}

export function RoomCard({ room, onDelete }: RoomCardProps) {
  // Determine lighting status
  const hasLightingFixture = room.lighting_fixture !== undefined;
  const lightingStatus = hasLightingFixture 
    ? (room.lighting_fixture?.status === 'functional' ? 'working' : 'maintenance')
    : 'unknown';
  
  // Format phone number if exists
  const formattedPhone = room.phone_number 
    ? `${room.phone_number.slice(0, 3)}-${room.phone_number.slice(3, 6)}-${room.phone_number.slice(6)}`
    : null;
  
  // Calculate occupancy percentage
  const occupancyPercentage = room.capacity && room.current_occupancy 
    ? Math.round((room.current_occupancy / room.capacity) * 100) 
    : null;
  
  // Show courtroom photos only for courtroom type
  const isCourtroom = room.room_type.toString().toLowerCase() === 'courtroom';
  
  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-medium">{room.name}</CardTitle>
          <Badge 
            variant={room.status === "active" ? "default" : "destructive"}
            className="ml-2"
          >
            {room.status}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Room #{room.room_number}</p>
          {lightingStatus !== 'unknown' && (
            <Badge 
              variant={lightingStatus === 'working' ? "default" : "outline"} 
              className="flex items-center gap-1"
            >
              <Lightbulb className="h-3 w-3" />
              {lightingStatus}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="flex-grow space-y-3 pb-3">
        {/* Room type and storage badge */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">
            {room.room_type.toString().replace(/_/g, ' ')}
          </Badge>
          {room.is_storage && (
            <Badge variant="outline">Storage</Badge>
          )}
          {room.current_function && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              {room.current_function}
            </Badge>
          )}
        </div>
        
        {/* Location information */}
        <div className="flex items-start gap-2 text-sm">
          <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            {room.floor?.building?.name && (
              <p className="text-muted-foreground">{room.floor.building.name}</p>
            )}
            {room.floor?.name && (
              <p className="text-muted-foreground">{room.floor.name}</p>
            )}
          </div>
        </div>
        
        {/* Phone number if available */}
        {formattedPhone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{formattedPhone}</span>
          </div>
        )}
        
        {/* Occupancy information */}
        {occupancyPercentage !== null && (
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {room.current_occupancy} / {room.capacity} ({occupancyPercentage}% occupied)
            </span>
          </div>
        )}
        
        {/* Connected spaces */}
        {room.space_connections && room.space_connections.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <ArrowRightLeft className="h-4 w-4" />
              <span>Connected to:</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {room.space_connections.slice(0, 2).map(conn => (
                <Badge key={conn.id} variant="outline" className="text-xs">
                  {conn.to_space?.name || `Space ${conn.to_space_id.substring(0, 4)}`}
                </Badge>
              ))}
              {room.space_connections.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{room.space_connections.length - 2} more
                </Badge>
              )}
            </div>
          </div>
        )}
        
        {/* Description */}
        {room.description && (
          <p className="text-sm line-clamp-2 text-muted-foreground">
            {room.description}
          </p>
        )}
        
        {/* Courtroom photos if applicable */}
        {isCourtroom && room.courtroom_photos && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Courtroom Photos:</p>
            <div className="grid grid-cols-2 gap-2">
              {room.courtroom_photos.judge_view && (
                <div className="space-y-1">
                  <img 
                    src={room.courtroom_photos.judge_view} 
                    alt="Judge View" 
                    className="h-24 w-full object-cover rounded-md"
                  />
                  <p className="text-xs text-center text-muted-foreground">Judge View</p>
                </div>
              )}
              {room.courtroom_photos.audience_view && (
                <div className="space-y-1">
                  <img 
                    src={room.courtroom_photos.audience_view} 
                    alt="Audience View" 
                    className="h-24 w-full object-cover rounded-md"
                  />
                  <p className="text-xs text-center text-muted-foreground">Audience View</p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-1 flex justify-end gap-2 border-t">
        <EditSpaceDialog
          id={room.id}
          initialData={{
            id: room.id,
            name: room.name,
            roomNumber: room.room_number,
            roomType: room.room_type,
            status: room.status as StatusEnum,
            description: room.description,
            isStorage: room.is_storage,
            storageType: room.storage_type,
            storageCapacity: room.storage_capacity,
            storageNotes: room.storage_notes,
            currentFunction: room.current_function,
            parentRoomId: room.parent_room_id,
            floorId: room.floor_id,
            type: "room"
          }}
          spaceType="room"
        />
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={() => onDelete(room.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
      <div className="px-6 py-1 text-xs text-muted-foreground border-t">
        Last updated: {format(new Date(room.updated_at), 'MMM d, yyyy')}
      </div>
    </Card>
  );
}
