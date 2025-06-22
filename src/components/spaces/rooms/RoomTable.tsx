
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { EditSpaceDialog } from "../EditSpaceDialog";
import { Room } from "../types/RoomTypes";
import { StatusEnum } from "./types/roomEnums";
import { ParentRoomHierarchy } from "./ParentRoomHierarchy";

interface RoomTableProps {
  rooms: Room[];
  onDelete: (id: string) => void;
}

export function RoomTable({ rooms, onDelete }: RoomTableProps) {
  return (
    <div>
      <ParentRoomHierarchy rooms={rooms} />
      <div className="rounded-md border">
        <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Room Number</TableHead>
            <TableHead>Building</TableHead>
            <TableHead>Floor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rooms.map((room) => (
            <TableRow key={room.id}>
              <TableCell>{room.name}</TableCell>
              <TableCell>{room.room_number}</TableCell>
              <TableCell>{room.floor?.building?.name || room.buildingName}</TableCell>
              <TableCell>{room.floor?.name || room.floorName}</TableCell>
              <TableCell>
                <Badge variant={room.status === StatusEnum.ACTIVE ? 'default' : 'destructive'}>
                  {room.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <EditSpaceDialog
                    id={room.id}
                    type="room"
                    onSpaceUpdated={() => console.log('Space updated successfully')}
                    initialData={{
                      id: room.id,
                      name: room.name,
                      roomNumber: room.room_number || '',
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
                    variant="destructive"
                    size="sm"
                    onClick={() => onDelete(room.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
    </div>
  );
}
