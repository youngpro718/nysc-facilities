import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Room {
  id: string;
  name: string;
  room_number: string;
  room_type?: string;
  building_id?: string;
  floor_id?: string;
}

interface TermRoomPickerProps {
  value: string;
  onChange: (value: string) => void;
  buildingId?: string;
  floorId?: string;
}

export function TermRoomPicker({ value, onChange, buildingId, floorId }: TermRoomPickerProps) {
  const [open, setOpen] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  
  useEffect(() => {
    async function fetchRooms() {
      try {
        setLoading(true);
        
        // Query that uses the rooms table directly, which is the correct table
        // based on the application's database structure
        let query = supabase.from('rooms').select('*');
        
        // Apply filters if provided
        if (buildingId) {
          query = query.eq('building_id', buildingId);
        }
        
        if (floorId) {
          query = query.eq('floor_id', floorId);
        }
        
        // Sort by room number for better user experience
        query = query.order('room_number', { ascending: true });
        
        const { data, error } = await query;
        
        if (error) {
          console.error('Error fetching rooms:', error);
          return;
        }
        
        setRooms(data || []);
        
        // If a value is provided, find the selected room
        if (value) {
          const room = data?.find(room => room.id === value) || null;
          setSelectedRoom(room);
        }
      } catch (error) {
        console.error('Error in fetchRooms:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchRooms();
  }, [value, buildingId, floorId]);
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={loading}
        >
          {loading ? (
            "Loading rooms..."
          ) : value && selectedRoom ? (
            `${selectedRoom.room_number} - ${selectedRoom.name}`
          ) : (
            "Select room..."
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput placeholder="Search rooms..." />
          <CommandEmpty>No rooms found.</CommandEmpty>
          <CommandGroup className="max-h-[300px] overflow-y-auto">
            {rooms.map((room) => (
              <CommandItem
                key={room.id}
                value={`${room.room_number} ${room.name}`}
                onSelect={() => {
                  onChange(room.id);
                  setSelectedRoom(room);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === room.id ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className="font-medium">{room.room_number}</span>
                <span className="ml-2 text-muted-foreground">{room.name}</span>
                {room.room_type && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {room.room_type}
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
