
import React from 'react';
import { Button } from "@/components/ui/button";
import { 
  Building, 
  ClipboardList, 
  UserCheck, 
  Phone, 
  Layers, 
  ExternalLink,
  Lightbulb,
  CalendarClock,
  Ruler,
  AlertTriangle,
  Info,
  Archive
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Room } from "../types/RoomTypes";
import { HallwayConnections } from "./HallwayConnections";
import { CourtroomPhotos } from "./CourtroomPhotos";
import { format } from "date-fns";

interface CardBackProps {
  room: Room;
  onFlip: () => void;
}

// Helper function to safely format dates
const safeFormatDate = (dateString: string | undefined) => {
  if (!dateString) return "Not specified";
  try {
    return format(new Date(dateString), 'MMM d, yyyy');
  } catch (error) {
    console.error("Invalid date:", dateString, error);
    return "Invalid date";
  }
};

export function CardBack({ room, onFlip }: CardBackProps) {
  return (
    <div className="p-5 flex flex-col h-full">
      {/* Floor & Building Navigation */}
      <div className="flex items-center mb-3 text-sm text-muted-foreground">
        <Building className="h-4 w-4 mr-1" />
        <span>
          {room.floor?.building?.name} • {room.floor?.name}
        </span>
      </div>

      {/* Scrollable content area */}
      <div className="space-y-3 flex-1 overflow-y-auto pr-1">
        {/* Room dimensions and basic info */}
        <div className="flex items-start">
          <Ruler className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
          <div>
            <span className="text-sm font-medium">Dimensions</span>
            <div className="text-sm">
              {room.size ? 
                `${room.size.width} × ${room.size.height} units` : 
                "Dimensions not specified"}
            </div>
          </div>
        </div>
        
        {/* Room capacity if available */}
        {room.storage_capacity && (
          <div className="flex items-start">
            <Info className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
            <div>
              <span className="text-sm font-medium">Capacity</span>
              <div className="text-sm">{room.storage_capacity}</div>
            </div>
          </div>
        )}

        {/* Parent Room */}
        {room.parent_room_id && (
          <div className="flex items-start">
            <Layers className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
            <div>
              <span className="text-sm font-medium">Parent Room</span>
              <div className="text-sm">{room.parent_room_id}</div>
            </div>
          </div>
        )}

        {/* Phone */}
        {room.phone_number && (
          <div className="flex items-start">
            <Phone className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
            <div>
              <span className="text-sm font-medium">Phone</span>
              <div className="text-sm">{room.phone_number}</div>
            </div>
          </div>
        )}

        {/* Room Function */}
        {room.current_function && (
          <div className="flex items-start">
            <ClipboardList className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
            <div>
              <span className="text-sm font-medium">Function</span>
              <div className="text-sm">{room.current_function}</div>
              {room.function_change_date && (
                <div className="text-xs text-muted-foreground mt-1">
                  Changed: {safeFormatDate(room.function_change_date)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Storage details if room is storage */}
        {room.is_storage && room.storage_type && (
          <div className="flex items-start">
            <Archive className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
            <div>
              <span className="text-sm font-medium">Storage Type</span>
              <div className="text-sm">
                {room.storage_type}
                {room.storage_notes && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Notes: {room.storage_notes}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div className="flex items-start">
          <CalendarClock className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
          <div>
            <span className="text-sm font-medium">Dates</span>
            <div className="text-xs">
              Created: {safeFormatDate(room.created_at)}
              <br />
              Updated: {safeFormatDate(room.updated_at)}
            </div>
          </div>
        </div>

        {/* Issues */}
        {room.issues && room.issues.length > 0 && (
          <div className="flex items-start">
            <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
            <div>
              <span className="text-sm font-medium">Issues</span>
              <div className="flex flex-wrap gap-1 mt-1">
                <Badge variant="outline" className="text-xs">
                  {room.issues.length} issue{room.issues.length !== 1 ? 's' : ''}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Occupants */}
        {room.current_occupants && room.current_occupants.length > 0 && (
          <div className="flex items-start">
            <UserCheck className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
            <div>
              <span className="text-sm font-medium">Occupants</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {room.current_occupants.map((occupant, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {occupant.first_name} {occupant.last_name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Lighting Fixtures */}
        {room.lighting_fixture && (
          <div className="flex items-start">
            <Lightbulb className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
            <div>
              <span className="text-sm font-medium">Lighting</span>
              <div className="text-sm">
                {room.lighting_fixture.type} • {room.lighting_fixture.status}
              </div>
            </div>
          </div>
        )}

        {/* Hallway Connections with Separator */}
        {room.space_connections && room.space_connections.length > 0 && (
          <>
            <Separator className="my-2" />
            <HallwayConnections connections={room.space_connections} />
          </>
        )}
        
        {/* Courtroom Photos */}
        {room.room_type === 'courtroom' && room.courtroom_photos && (
          <CourtroomPhotos room={room} />
        )}
      </div>

      {/* Actions */}
      <div className="mt-4 flex justify-between">
        <Button variant="ghost" size="sm" onClick={onFlip}>
          Back to Details
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a href={`/spaces/rooms/${room.id}`} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-1" />
            View Full Details
          </a>
        </Button>
      </div>
    </div>
  );
}
