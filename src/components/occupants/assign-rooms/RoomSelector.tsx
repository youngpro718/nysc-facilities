
import { SelectContent, SelectItem, SelectTrigger, SelectValue, Select } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

interface RoomDetails {
  id: string;
  name: string;
  room_number: string;
  capacity: number | null;
  current_occupancy: number;
  floors: {
    name: string;
    buildings: {
      name: string;
    };
  } | null;
}

interface RoomSelectorProps {
  selectedRoom: string;
  onRoomSelect: (roomId: string) => void;
  availableRooms?: RoomDetails[];
}

export function RoomSelector({ selectedRoom, onRoomSelect, availableRooms }: RoomSelectorProps) {
  return (
    <div className="space-y-4">
      <label className="text-sm font-medium">Select Room</label>
      <Select
        value={selectedRoom}
        onValueChange={onRoomSelect}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a room" />
        </SelectTrigger>
        <SelectContent>
          <ScrollArea className="max-h-[300px]">
            {availableRooms?.map((room) => (
              <SelectItem key={room.id} value={room.id}>
                <div className="flex items-center justify-between w-full pr-4">
                  <span>
                    {room.name} - {room.floors?.name}, {room.floors?.buildings?.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      !room.capacity ? "secondary" :
                      room.current_occupancy >= room.capacity ? "destructive" :
                      room.current_occupancy >= room.capacity * 0.8 ? "outline" :
                      "default"
                    }>
                      <Users className="w-3 h-3 mr-1" />
                      {room.current_occupancy}{room.capacity ? `/${room.capacity}` : ''}
                    </Badge>
                  </div>
                </div>
              </SelectItem>
            ))}
          </ScrollArea>
        </SelectContent>
      </Select>
    </div>
  );
}
