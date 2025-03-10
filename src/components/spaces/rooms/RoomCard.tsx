
import { Room } from "./types/RoomTypes";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { EditSpaceDialog } from "../EditSpaceDialog";

export interface RoomCardProps {
  room: Room;
  onDelete: (id: string) => void;
}

export function RoomCard({ room, onDelete }: RoomCardProps) {
  return (
    <Card className="h-full flex flex-col">
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
        <p className="text-sm text-muted-foreground">Room #{room.room_number}</p>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="space-y-2">
          <p className="text-sm">
            <span className="font-medium">Type:</span> {room.room_type.toString()}
          </p>
          {room.floor?.building?.name && (
            <p className="text-sm">
              <span className="font-medium">Building:</span> {room.floor.building.name}
            </p>
          )}
          {room.floor?.name && (
            <p className="text-sm">
              <span className="font-medium">Floor:</span> {room.floor.name}
            </p>
          )}
          {room.description && (
            <p className="text-sm line-clamp-2 text-muted-foreground">
              {room.description}
            </p>
          )}
          {room.is_storage && (
            <Badge variant="outline">Storage</Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-1 flex justify-end gap-2">
        <EditSpaceDialog
          id={room.id}
          type="room"
          initialData={{
            id: room.id,
            name: room.name,
            roomNumber: room.room_number,
            roomType: room.room_type,
            status: room.status,
            description: room.description || "",
            isStorage: room.is_storage || false,
            storageType: room.storage_type || null,
            storageCapacity: room.storage_capacity || null,
            storageNotes: room.storage_notes || null,
            floorId: room.floor_id,
            parentRoomId: room.parent_room_id || null,
            currentFunction: room.current_function || null,
            phoneNumber: room.phone_number || null,
            connections: room.space_connections?.map(conn => ({
              id: conn.id,
              toSpaceId: conn.to_space_id,
              connectionType: conn.connection_type,
              direction: conn.direction || null
            })) || [],
            type: "room"
          }}
        />
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={() => onDelete(room.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
