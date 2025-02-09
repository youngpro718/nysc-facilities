
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Phone, Users } from "lucide-react";
import { EditSpaceDialog } from "../../EditSpaceDialog";
import { Room } from "../types/RoomTypes";
import { LightingStatusIndicator } from "./LightingStatusIndicator";

interface CardFrontProps {
  room: Room;
  onDelete: (id: string) => void;
}

export function CardFront({ room, onDelete }: CardFrontProps) {
  return (
    <Card className="absolute w-full h-full backface-hidden">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>{room.name}</span>
            <Badge variant={room.status === 'active' ? 'default' : 'destructive'}>
              {room.status}
            </Badge>
          </div>
          <div className="flex gap-2">
            <EditSpaceDialog
              id={room.id}
              type="room"
              initialData={{
                name: room.name,
                type: "room",
                status: room.status,
                floorId: room.floor_id,
              }}
            />
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(room.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            {room.room_number && (
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">Room Number:</p>
                <Badge variant="outline">{room.room_number}</Badge>
              </div>
            )}
            <p className="text-sm text-muted-foreground">Type: {room.room_type}</p>
            <div className="flex items-center gap-2">
              <LightingStatusIndicator 
                fixture={room.lighting_fixture} 
              />
            </div>
            {room.phone_number && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Phone className="h-4 w-4" />
                {room.phone_number}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {room.occupant_count ? `${room.occupant_count} occupant${room.occupant_count !== 1 ? 's' : ''}` : 'No occupants'}
              </span>
            </div>
            {room.current_occupants && room.current_occupants.length > 0 && (
              <div className="mt-1 pl-6">
                {room.current_occupants.map((occupant, index) => (
                  <p key={index} className="text-sm text-muted-foreground">
                    {occupant.first_name} {occupant.last_name}
                    {occupant.title && ` - ${occupant.title}`}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
