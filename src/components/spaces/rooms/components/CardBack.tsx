
import React from 'react';
import { Button } from "@/components/ui/button";
import { 
  Building, 
  ClipboardList, 
  UserCheck, 
  Phone, 
  Layers, 
  ExternalLink,
  Lightbulb
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Room } from "../types/RoomTypes";
import { HallwayConnections } from "./HallwayConnections";

interface CardBackProps {
  room: Room;
  onFlip: () => void;
}

export function CardBack({ room, onFlip }: CardBackProps) {
  return (
    <div className="p-5 flex flex-col h-full">
      {/* Floor & Building */}
      <div className="flex items-center mb-3 text-sm text-muted-foreground">
        <Building className="h-4 w-4 mr-1" />
        <span>
          {room.floor?.building?.name} • {room.floor?.name}
        </span>
      </div>

      {/* Additional Details */}
      <div className="space-y-2 flex-1">
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

        {/* Hallway Connections */}
        {room.space_connections && room.space_connections.length > 0 && (
          <HallwayConnections connections={room.space_connections} />
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
