
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { OccupantQueryResponse, RoomReference } from "./types/occupantTypes";
import { Building2, CalendarDays, Link } from "lucide-react";
import { cn } from "@/lib/utils";

interface OccupantDetailsProps {
  occupant: OccupantQueryResponse;
}

function RoomCard({ room }: { room: RoomReference }) {
  return (
    <Card className="mb-2">
      <CardContent className="p-4">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium">{room.name}</span>
            <Badge variant={room.is_primary ? "default" : "secondary"}>
              {room.assignment_type.replace('_', ' ')}
            </Badge>
          </div>
          
          <div className="flex items-center text-sm text-muted-foreground">
            <Building2 className="mr-2 h-4 w-4" />
            <span>{room.floors.buildings.name} &gt; {room.floors.name}</span>
          </div>

          {room.schedule && (room.schedule.days.length > 0 || room.schedule.hours) && (
            <div className="flex items-center text-sm text-muted-foreground">
              <CalendarDays className="mr-2 h-4 w-4" />
              <span>
                {room.schedule.days.join(', ')} 
                {room.schedule.hours && ` (${room.schedule.hours})`}
              </span>
            </div>
          )}

          {room.related_rooms && room.related_rooms.length > 0 && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Link className="mr-2 h-4 w-4" />
              <div className="flex flex-wrap gap-1">
                {room.related_rooms.map((related) => (
                  <Badge 
                    key={related.room_id}
                    variant="outline" 
                    className="text-xs"
                  >
                    {related.room_name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {room.notes && (
            <p className="text-sm text-muted-foreground mt-2">
              {room.notes}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function OccupantDetails({ occupant }: OccupantDetailsProps) {
  const roomsByType = React.useMemo(() => {
    if (!occupant.rooms) return null;

    return occupant.rooms.reduce((acc, room) => {
      const type = room.assignment_type;
      if (!acc[type]) acc[type] = [];
      acc[type].push(room);
      return acc;
    }, {} as Record<string, RoomReference[]>);
  }, [occupant.rooms]);

  if (!roomsByType) return null;

  return (
    <div className="space-y-6">
      {Object.entries(roomsByType).map(([type, rooms]) => (
        <div key={type} className="space-y-2">
          <h3 className={cn(
            "text-sm font-medium",
            type === "primary_office" && "text-primary"
          )}>
            {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </h3>
          <div className="space-y-2">
            {rooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
