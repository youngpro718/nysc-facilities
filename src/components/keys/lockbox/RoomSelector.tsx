import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, Plus, Building, Search, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";

interface Room {
  id: string;
  room_number: string;
  name?: string;
  floor?: {
    name: string;
    building?: {
      name: string;
    };
  };
}

interface RoomSelectorProps {
  value?: string; // room_id
  roomNumber?: string; // legacy room_number for display
  onChange: (roomId: string | null, roomNumber: string | null) => void;
  disabled?: boolean;
  onCreateRoom?: (roomNumber: string) => void;
}

export function RoomSelector({ value, roomNumber, onChange, disabled, onCreateRoom }: RoomSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ["rooms-for-selector"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select(`
          id,
          room_number,
          name,
          floor:floors(
            name,
            building:buildings(name)
          )
        `)
        .order('room_number', { ascending: true });

      if (error) throw error;
      
      // Transform data to flatten the nested structure
      return (data || []).map((room: any) => ({
        id: room.id,
        room_number: room.room_number,
        name: room.name,
        floor: room.floor ? {
          name: Array.isArray(room.floor) ? room.floor[0]?.name : room.floor.name,
          building: (() => {
            const f = Array.isArray(room.floor) ? room.floor[0] : room.floor;
            const b = f?.building;
            const bObj = Array.isArray(b) ? b[0] : b;
            return bObj ? { name: bObj.name } : undefined;
          })()
        } : undefined
      })) as Room[];
    },
  });

  const selectedRoom = useMemo(() => {
    if (value) {
      return rooms.find(room => room.id === value);
    }
    return null;
  }, [rooms, value]);

  const filteredRooms = useMemo(() => {
    if (!searchValue) return rooms;
    const search = searchValue.toLowerCase();
    return rooms.filter(room => 
      room.room_number.toLowerCase().includes(search) ||
      room.name?.toLowerCase().includes(search) ||
      room.floor?.name?.toLowerCase().includes(search) ||
      room.floor?.building?.name?.toLowerCase().includes(search)
    );
  }, [rooms, searchValue]);

  // Check if the current roomNumber (legacy) matches any room
  const hasUnlinkedRoomNumber = roomNumber && !value && rooms.length > 0;
  const matchingRoom = hasUnlinkedRoomNumber 
    ? rooms.find(r => r.room_number === roomNumber)
    : null;

  const getDisplayValue = () => {
    if (selectedRoom) {
      return `${selectedRoom.room_number}${selectedRoom.name ? ` - ${selectedRoom.name}` : ''}`;
    }
    if (roomNumber && !value) {
      return roomNumber;
    }
    return "Select room...";
  };

  const handleSelect = (room: Room) => {
    onChange(room.id, room.room_number);
    setOpen(false);
    setSearchValue("");
  };

  const handleClear = () => {
    onChange(null, null);
    setOpen(false);
    setSearchValue("");
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between",
              hasUnlinkedRoomNumber && !matchingRoom && "border-yellow-500"
            )}
            disabled={disabled}
          >
            <span className="truncate">{getDisplayValue()}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[350px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput 
              placeholder="Search rooms..." 
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              <CommandEmpty>
                <div className="py-4 text-center">
                  <p className="text-sm text-muted-foreground mb-3">
                    No room found for "{searchValue}"
                  </p>
                  {onCreateRoom && searchValue && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        onCreateRoom(searchValue);
                        setOpen(false);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Room "{searchValue}"
                    </Button>
                  )}
                </div>
              </CommandEmpty>
              
              {value && (
                <>
                  <CommandGroup>
                    <CommandItem onSelect={handleClear} className="text-muted-foreground">
                      <span>Clear selection (no room)</span>
                    </CommandItem>
                  </CommandGroup>
                  <CommandSeparator />
                </>
              )}

              {/* Show suggestion to link if there's an unlinked room number that matches */}
              {matchingRoom && !value && (
                <>
                  <CommandGroup heading="Suggested Match">
                    <CommandItem
                      value={matchingRoom.id}
                      onSelect={() => handleSelect(matchingRoom)}
                      className="bg-yellow-50 dark:bg-yellow-950/30 dark:bg-yellow-950/20"
                    >
                      <Check className={cn("mr-2 h-4 w-4", value === matchingRoom.id ? "opacity-100" : "opacity-0")} />
                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{matchingRoom.room_number}</span>
                          {matchingRoom.name && (
                            <span className="text-muted-foreground truncate">- {matchingRoom.name}</span>
                          )}
                        </div>
                        {matchingRoom.floor && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            {matchingRoom.floor.building?.name} - {matchingRoom.floor.name}
                          </span>
                        )}
                      </div>
                      <Badge variant="outline" className="ml-2 text-xs">Link</Badge>
                    </CommandItem>
                  </CommandGroup>
                  <CommandSeparator />
                </>
              )}

              <CommandGroup heading="All Rooms">
                {isLoading ? (
                  <div className="py-4 text-center text-sm text-muted-foreground">
                    Loading rooms...
                  </div>
                ) : (
                  filteredRooms.slice(0, 50).map((room) => (
                    <CommandItem
                      key={room.id}
                      value={room.id}
                      onSelect={() => handleSelect(room)}
                    >
                      <Check className={cn("mr-2 h-4 w-4", value === room.id ? "opacity-100" : "opacity-0")} />
                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{room.room_number}</span>
                          {room.name && (
                            <span className="text-muted-foreground truncate">- {room.name}</span>
                          )}
                        </div>
                        {room.floor && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            {room.floor.building?.name} - {room.floor.name}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))
                )}
                {filteredRooms.length > 50 && (
                  <div className="py-2 px-4 text-xs text-muted-foreground text-center">
                    Showing first 50 results. Type to search more.
                  </div>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Warning for unlinked room number */}
      {hasUnlinkedRoomNumber && !matchingRoom && (
        <div className="flex items-start gap-2 text-xs text-yellow-600 dark:text-yellow-400 dark:text-yellow-500">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            Room "{roomNumber}" is not linked to any room in the database. 
            Select a room above or create a new one.
          </span>
        </div>
      )}
    </div>
  );
}
