
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Phone, Users, Building2 } from "lucide-react";
import { EditSpaceDialog } from "../../EditSpaceDialog";
import { Room } from "../types/RoomTypes";
import { StatusEnum } from "../types/roomEnums";
import { LightingStatusIndicator } from "./LightingStatusIndicator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRoomOccupants } from "../../hooks/useRoomOccupants";

interface CardFrontProps {
  room: Room;
  onDelete: (id: string) => void;
}

export function CardFront({ room, onDelete }: CardFrontProps) {
  const { data: occupants, isLoading: isLoadingOccupants } = useRoomOccupants(room.id);

  return (
    <Card className="absolute w-full h-full backface-hidden">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>{room.name}</span>
            <Badge variant={room.status === StatusEnum.ACTIVE ? 'default' : 'destructive'}>
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
                status: room.status === "active" ? StatusEnum.ACTIVE : 
                       room.status === "inactive" ? StatusEnum.INACTIVE : 
                       StatusEnum.UNDER_MAINTENANCE,
                floorId: room.floor_id,
                roomNumber: room.room_number,
                roomType: room.room_type,
                phoneNumber: room.phone_number || "",
                description: room.description || "",
                isStorage: room.is_storage,
                storageCapacity: room.storage_capacity,
                storageType: room.storage_type,
                storageNotes: room.storage_notes || "",
                parentRoomId: room.parent_room_id || null,
                currentFunction: room.current_function || "",
                position: room.position || { x: 0, y: 0 },
                size: room.size || { width: 150, height: 100 },
                rotation: room.rotation || 0
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
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            {room.room_number && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Room {room.room_number}</p>
              </div>
            )}
            <p className="text-sm text-muted-foreground">Type: {room.room_type}</p>
            <div className="flex items-center gap-2">
              <LightingStatusIndicator roomId={room.id} />
            </div>
            {room.phone_number && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Phone className="h-4 w-4" />
                {room.phone_number}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {isLoadingOccupants 
                  ? 'Loading occupants...'
                  : occupants?.length 
                    ? `${occupants.length} occupant${occupants.length !== 1 ? 's' : ''}`
                    : 'No occupants'}
              </span>
            </div>
            {occupants && occupants.length > 0 && (
              <ScrollArea className="h-[100px] rounded-md border p-2">
                {occupants.map((occupant) => (
                  <div key={occupant.id} className="text-sm py-1">
                    <p className="font-medium">{occupant.first_name} {occupant.last_name}</p>
                    {occupant.title && (
                      <p className="text-muted-foreground text-xs">{occupant.title}</p>
                    )}
                    {occupant.is_primary && (
                      <Badge variant="outline" className="mt-1">Primary</Badge>
                    )}
                  </div>
                ))}
              </ScrollArea>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
