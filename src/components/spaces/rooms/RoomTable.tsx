
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Phone, MapPin } from "lucide-react";
import { Room } from "./types/RoomTypes";
import { ParentRoomHierarchy } from "./ParentRoomHierarchy";
import { EditSpaceDialog } from "../EditSpaceDialog";

interface RoomTableProps {
  rooms: Room[];
  onDelete: (id: string) => void;
}

export function RoomTable({ rooms, onDelete }: RoomTableProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'under_maintenance':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getRoomTypeLabel = (roomType: string) => {
    switch (roomType) {
      case 'office':
        return 'Office';
      case 'courtroom':
        return 'Courtroom';
      case 'chamber':
        return 'Chamber';
      case 'storage':
        return 'Storage';
      case 'male_locker_room':
        return 'Male Locker';
      case 'female_locker_room':
        return 'Female Locker';
      default:
        return roomType;
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Room</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Hierarchy</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Details</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rooms.map((room) => (
            <TableRow key={room.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{room.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {room.room_number}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {getRoomTypeLabel(room.room_type)}
                </Badge>
              </TableCell>
              <TableCell>
                <ParentRoomHierarchy roomId={room.id} compact={true} />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-sm">
                  <MapPin className="h-3 w-3" />
                  {room.floor?.building?.name} • {room.floor?.name}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={getStatusColor(room.status)}>
                  {room.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  {room.phone_number && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      <span className="truncate max-w-[100px]">{room.phone_number}</span>
                    </div>
                  )}
                </div>
              </TableCell>
               <TableCell className="text-right">
                 <div className="flex items-center justify-end gap-2">
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
                     variant="custom"
                   />
                   <Button 
                     variant="ghost" 
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
