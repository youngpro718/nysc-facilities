
import { Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface RoomSelectionSectionProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedRoom: string;
  onRoomChange: (value: string) => void;
  filteredRooms: any[];
  isLoadingRooms: boolean;
  label?: string;
}

export function RoomSelectionSection({
  searchQuery,
  onSearchChange,
  selectedRoom,
  onRoomChange,
  filteredRooms,
  isLoadingRooms,
  label = "Search and Select Room"
}: RoomSelectionSectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${label.toLowerCase()}...`}
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
        <SelectTrigger className={cn(
          "w-full",
          !selectedRoom && "text-muted-foreground"
        )}>
          <SelectValue placeholder={isLoadingRooms ? "Loading rooms..." : `Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          <ScrollArea className="max-h-[300px]">
            {filteredRooms.length === 0 ? (
              <div className="p-2 text-sm text-muted-foreground text-center">
                {isLoadingRooms ? "Loading..." : "No rooms found"}
              </div>
            ) : (
              filteredRooms.map((room) => (
                <SelectItem 
                  key={room.id} 
                  value={room.id}
                  className="focus:bg-accent focus:text-accent-foreground"
                >
                  <div className="flex items-center justify-between w-full pr-4">
                    <span className="flex flex-col">
                      <span>{room.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {room.floor?.name}, {room.floor?.buildings?.name}
                      </span>
                    </span>
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
                </SelectItem>
              ))
            )}
          </ScrollArea>
        </SelectContent>
      </Select>
    </div>
  );
}
