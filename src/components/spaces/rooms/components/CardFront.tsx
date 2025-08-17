
import { Room } from "../types/RoomTypes";
import { EnhancedRoom } from "../types/EnhancedRoomTypes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2, ArrowRightFromLine, Users, Shield, Lightbulb, ShoppingBag, AlertTriangle } from "lucide-react";
import { EditSpaceDialog } from "../../EditSpaceDialog";
import { CourtroomPhotos } from './CourtroomPhotos';
import { CourtroomPhotoThumbnail } from './CourtroomPhotoThumbnail';
import { ParentRoomHierarchy } from "../ParentRoomHierarchy";
import { RoomAccessSummary } from "@/components/access/RoomAccessSummary";
import { SmartBadges } from "./badges/SmartBadges";
import { LightingReportDialog } from "./lighting/LightingReportDialog";
import { useCourtIssuesIntegration } from "@/hooks/useCourtIssuesIntegration";

interface CardFrontProps {
  room: EnhancedRoom;
  onFlip: (e?: React.MouseEvent) => void;
  onDelete: (id: string) => void;
  isHovered?: boolean;
}

export function CardFront({ room, onFlip, onDelete, isHovered = false }: CardFrontProps) {
  const { getIssuesForRoom } = useCourtIssuesIntegration();
  const unresolvedIssues = getIssuesForRoom(room.id);
  const hasIssues = unresolvedIssues.length > 0;
  const highSeverityCount = unresolvedIssues.filter(i => ["urgent", "high", "critical"].includes((i.priority || "").toLowerCase())).length;
  return (
    <div className="relative p-5 flex flex-col h-full overflow-y-auto">
      {/* Issue Alert - Top Left Corner */}
      {hasIssues && (
        <div className="absolute top-2 left-2 flex items-center gap-2 z-10">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <Badge variant="destructive" className="text-[10px] flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {unresolvedIssues.length}
            <span className="hidden sm:inline">open</span>
            {highSeverityCount > 0 && (
              <span className="ml-1 text-[10px] bg-white/20 px-1 rounded">
                {highSeverityCount} high
              </span>
            )}
          </Badge>
        </div>
      )}
      {/* Hover Action Buttons - Top Right Corner */}
      <div className={`absolute top-2 right-2 flex flex-col gap-1 transition-all duration-300 z-10 ${
        isHovered ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}>
        <Button
          variant="secondary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onFlip(e);
          }}
          className="hidden md:flex bg-black/80 hover:bg-black text-white border-0 shadow-lg transition-all duration-200 h-8 w-8 p-0"
          title="More Details"
        >
          <ArrowRightFromLine className="h-3 w-3" />
        </Button>
        
        <LightingReportDialog
          room={room}
          trigger={
            <Button
              variant="secondary"
              size="sm"
              className="bg-black/80 hover:bg-black text-white border-0 shadow-lg transition-all duration-200 h-8 w-8 p-0"
              title="Report Light Out"
              onClick={(e) => e.stopPropagation()}
            >
              <Lightbulb className="h-3 w-3" />
            </Button>
          }
        />
        
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="secondary"
              size="sm"
              className="bg-black/80 hover:bg-black text-white border-0 shadow-lg transition-all duration-200 h-8 w-8 p-0"
              title="Who Has Access"
              onClick={(e) => e.stopPropagation()}
            >
              <Shield className="h-3 w-3" />
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
          onClick={(e) => {
            e.stopPropagation();
            onDelete(room.id);
          }}
          className="bg-red-600/90 hover:bg-red-600 text-white border-0 shadow-lg transition-all duration-200 h-8 w-8 p-0"
          title="Delete Room"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
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
              className="w-full flex items-center justify-center"
              onClick={(e) => {
                e.stopPropagation();
                const event = new CustomEvent('openInventoryDialog', { 
                  detail: { roomId: room.id, roomName: room.name } 
                });
                window.dispatchEvent(event);
              }}
              title="View Inventory"
            >
              <ShoppingBag className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="flex-1">
        {/* Practical Room Information */}
        <div className="space-y-2 mb-3">
          {/* Room Function & Usage */}
          {room.current_function && room.current_function !== room.room_type ? (
            <div className="text-sm">
              <span className="font-medium text-foreground">Current Use:</span>
              <span className="text-muted-foreground ml-1">{room.current_function}</span>
            </div>
          ) : room.room_type === 'courtroom' && !room.current_function ? (
            <div className="text-sm">
              <span className="font-medium text-foreground">Function:</span>
              <span className="text-muted-foreground ml-1">Active Courtroom</span>
            </div>
          ) : null}
          
          {/* Floor & Building Info */}
          <div className="text-sm">
            <span className="font-medium text-foreground">Location:</span>
            <span className="text-muted-foreground ml-1">
              {room.floor?.building?.name}, Floor {room.floor?.name}
            </span>
          </div>
        </div>
        
        {/* Description - only if meaningful */}
        {room.description && room.description.trim() !== "" && !room.description.toLowerCase().includes("no description") ? (
          <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
            {room.description}
          </p>
        ) : null}

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

      {/* Old action buttons removed - now using hover overlay */}
    </div>
  );
}
