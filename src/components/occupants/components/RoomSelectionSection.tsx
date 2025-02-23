
import { Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface RoomSelectionSectionProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedRoom: string;
  onRoomChange: (value: string) => void;
  filteredRooms: any[];
  isLoadingRooms: boolean;
}

export function RoomSelectionSection({
  searchQuery,
  onSearchChange,
  selectedRoom,
  onRoomChange,
  filteredRooms,
  isLoadingRooms
}: RoomSelectionSectionProps) {
  return (
    <div className="space-y-4">
      <label className="text-sm font-medium">Search and Select Room</label>
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search rooms..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>
      <Select
        value={selectedRoom}
        onValueChange={onRoomChange}
        disabled={isLoadingRooms}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={isLoadingRooms ? "Loading rooms..." : "Select a room"} />
        </SelectTrigger>
        <SelectContent>
          <ScrollArea className="max-h-[300px]">
            {filteredRooms?.map((room) => (
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
