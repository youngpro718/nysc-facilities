
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, DoorClosed, Users } from "lucide-react";
import { UserAssignment } from "@/types/dashboard";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDialogManager } from "@/hooks/useDialogManager";

interface AssignedRoomsCardProps {
  rooms: UserAssignment[];
}

export function AssignedRoomsCard({ rooms }: AssignedRoomsCardProps) {
  const { openDialog } = useDialogManager();

  const handleViewRoom = (roomId: string) => {
    openDialog('roomDetails', { roomId });
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-2xl font-semibold">Assigned Rooms</h2>
        </div>
        <Badge variant="outline" className="font-normal">
          {rooms.length} {rooms.length === 1 ? 'Room' : 'Rooms'}
        </Badge>
      </div>
      
      <ScrollArea className="h-[300px] pr-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Room Details</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Assignment Info</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rooms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  <div className="flex flex-col items-center gap-2 py-4">
                    <DoorClosed className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No rooms assigned</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              rooms.map((room) => (
                <TableRow key={room.id}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{room.room_name}</span>
                      <span className="text-sm text-muted-foreground">
                        Room {room.room_number}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm">{room.building_name}</span>
                      <span className="text-sm text-muted-foreground">
                        Floor: {room.floor_name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="outline" className="w-fit">
                              <Users className="h-3 w-3 mr-1" />
                              {room.is_primary ? 'Primary' : 'Secondary'}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            {room.is_primary 
                              ? 'This is your primary assigned room'
                              : 'This is a secondary room assignment'}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <span className="text-xs text-muted-foreground">
                        Since {new Date(room.assigned_at).toLocaleDateString()}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewRoom(room.room_id || '');
                      }}
                      className="w-full"
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ScrollArea>
    </Card>
  );
}
