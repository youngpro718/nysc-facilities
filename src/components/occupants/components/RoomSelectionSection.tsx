
import { Search, Users, ChevronDown, Building, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";

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
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedRoomData = filteredRooms.find(room => room.id === selectedRoom);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRoomSelect = (roomId: string) => {
    onRoomChange(roomId);
    setIsOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={`Search ${label.toLowerCase()}...`}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Custom Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-between h-auto min-h-[2.5rem] p-3",
            !selectedRoom && "text-muted-foreground"
          )}
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoadingRooms}
        >
          {isLoadingRooms ? (
            <span>Loading rooms...</span>
          ) : selectedRoomData ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">{selectedRoomData.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {selectedRoomData.floors?.buildings?.name} - {selectedRoomData.floors?.name}
                  </div>
                </div>
              </div>
              <Badge variant={
                !selectedRoomData.capacity ? "secondary" :
                selectedRoomData.current_occupancy >= selectedRoomData.capacity ? "destructive" :
                selectedRoomData.current_occupancy >= selectedRoomData.capacity * 0.8 ? "outline" :
                "default"
              }>
                <Users className="w-3 h-3 mr-1" />
                {selectedRoomData.current_occupancy}{selectedRoomData.capacity ? `/${selectedRoomData.capacity}` : ''}
              </Badge>
            </div>
          ) : (
            <span>Select {label.toLowerCase()}</span>
          )}
          <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
        </Button>

        {/* Dropdown Content */}
        {isOpen && (
          <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-[300px] overflow-hidden border bg-popover shadow-lg">
            <div className="overflow-y-auto max-h-[300px] p-2">
              {filteredRooms.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground text-center">
                  {isLoadingRooms ? "Loading..." : "No rooms found"}
                </div>
              ) : (
                <RadioGroup value={selectedRoom} onValueChange={handleRoomSelect}>
                  {filteredRooms.map((room) => (
                    <div key={room.id} className="relative">
                      <RadioGroupItem
                        value={room.id}
                        id={`room-${room.id}`}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={`room-${room.id}`}
                        className={cn(
                          "flex items-center justify-between w-full p-3 rounded-lg cursor-pointer",
                          "hover:bg-accent hover:text-accent-foreground transition-colors",
                          "peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:border-primary",
                          "border border-transparent"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{room.name}</div>
                            <div className="text-xs text-muted-foreground">
                              Room {room.room_number} • {room.floors?.buildings?.name} - {room.floors?.name}
                            </div>
                          </div>
                        </div>
                        <Badge variant={
                          !room.capacity ? "secondary" :
                          room.current_occupancy >= room.capacity ? "destructive" :
                          room.current_occupancy >= room.capacity * 0.8 ? "outline" :
                          "default"
                        }>
                          <Users className="w-3 h-3 mr-1" />
                          {room.current_occupancy}{room.capacity ? `/${room.capacity}` : ''}
                        </Badge>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
