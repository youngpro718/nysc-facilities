
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
import { Room } from "./types/RoomTypes";

interface RoomTableProps {
  rooms: Room[];
  onDelete: (id: string) => void;
}

export function RoomTable({ rooms, onDelete }: RoomTableProps) {
  return (
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
              <TableCell>{room.floor?.building?.name}</TableCell>
              <TableCell>{room.floor?.name}</TableCell>
              <TableCell>
                <Badge variant={room.status === 'active' ? 'default' : 'destructive'}>
                  {room.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
