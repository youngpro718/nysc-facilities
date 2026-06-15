import { useMemo, useState } from 'react';
import { Check, ChevronsUpDown, MapPin, Building, Star } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useUserRoomAssignments } from '@features/spaces/hooks/useUserRoomAssignments';
import { useDeliveryLocations } from '@features/supply/hooks/useDeliveryLocations';

interface RoomRow {
  id: string;
  room_number: string;
  name?: string | null;
  floor?: { name?: string; building?: { name?: string } };
}

interface DeliveryRoomPickerProps {
  value: string;
  onChange: (label: string) => void;
  userId?: string;
  invalid?: boolean;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  modal?: boolean;
}

function formatRoomLabel(r: { room_number: string; name?: string | null }): string {
  const num = String(r.room_number).trim();
  const name = (r.name ?? '').trim();
  if (!num) return name;
  if (!name) return `Room ${num}`;
  return `Room ${num} — ${name}`;
}

/**
 * Searchable delivery-location picker backed by the rooms table.
 * Writes a normalized "Room {number} — {name}" string into delivery_location.
 * Pinned sections show the user's assigned rooms and recent destinations.
 */
export function DeliveryRoomPicker({
  value,
  onChange,
  userId,
  invalid,
  placeholder = 'Search rooms…',
  className,
  triggerClassName,
}: DeliveryRoomPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { data: assignments = [] } = useUserRoomAssignments(userId);
  const { recentOptions } = useDeliveryLocations(userId);

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ['rooms-for-delivery-picker'],
    staleTime: 5 * 60 * 1000,
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
      return (data || [])
        .filter((r: any) => r?.room_number != null && String(r.room_number).trim() !== '')
        .map((r: any) => {
          const f = Array.isArray(r.floor) ? r.floor[0] : r.floor;
          const b = f?.building;
          const bObj = Array.isArray(b) ? b[0] : b;
          return {
            id: r.id,
            room_number: String(r.room_number),
            name: r.name,
            floor: f ? { name: f.name, building: bObj ? { name: bObj.name } : undefined } : undefined,
          } as RoomRow;
        });
    },
  });

  const assignedRooms = useMemo(() => {
    return (assignments || [])
      .map(a => a.rooms)
      .filter((r): r is NonNullable<typeof r> => !!r && !!r.room_number)
      .map(r => ({ id: r.id, room_number: String(r.room_number), name: r.name }));
  }, [assignments]);

  const filtered = useMemo(() => {
    if (!search.trim()) return rooms;
    const q = search.toLowerCase();
    return rooms.filter(r =>
      r.room_number.toLowerCase().includes(q) ||
      (r.name ?? '').toLowerCase().includes(q) ||
      (r.floor?.name ?? '').toLowerCase().includes(q) ||
      (r.floor?.building?.name ?? '').toLowerCase().includes(q)
    );
  }, [rooms, search]);

  const selectLabel = (label: string) => {
    onChange(label);
    setOpen(false);
    setSearch('');
  };

  return (
    <div className={cn('space-y-1', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-invalid={invalid || undefined}
            className={cn(
              'w-full justify-between h-11 font-normal',
              !value && 'text-muted-foreground',
              invalid && 'border-destructive focus-visible:ring-destructive',
              triggerClassName,
            )}
          >
            <span className="flex items-center gap-2 min-w-0 truncate">
              <MapPin className="h-4 w-4 shrink-0 opacity-60" />
              <span className="truncate">{value || placeholder}</span>
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[--radix-popover-trigger-width] min-w-[300px] p-0 z-[60]"
          align="start"
          sideOffset={4}
          collisionPadding={8}
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search by room number, name, or building…"
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>
                {isLoading ? 'Loading rooms…' : `No rooms found for "${search}"`}
              </CommandEmpty>

              {assignedRooms.length > 0 && !search && (
                <>
                  <CommandGroup heading="Your rooms">
                    {assignedRooms.map(r => {
                      const label = formatRoomLabel(r);
                      return (
                        <CommandItem
                          key={`assigned-${r.id}`}
                          value={`assigned-${r.id}`}
                          onSelect={() => selectLabel(label)}
                        >
                          <Star className="mr-2 h-3.5 w-3.5 text-amber-500" />
                          <span className="flex-1 truncate">{label}</span>
                          {value === label && <Check className="ml-2 h-4 w-4" />}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                  <CommandSeparator />
                </>
              )}

              {recentOptions.length > 0 && !search && (
                <>
                  <CommandGroup heading="Recent">
                    {recentOptions.map(opt => (
                      <CommandItem
                        key={`recent-${opt.value}`}
                        value={`recent-${opt.value}`}
                        onSelect={() => selectLabel(opt.label)}
                      >
                        <span className="flex-1 truncate text-muted-foreground">{opt.label}</span>
                        {value === opt.label && <Check className="ml-2 h-4 w-4" />}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandSeparator />
                </>
              )}

              <CommandGroup heading={search ? 'Matches' : 'All rooms'}>
                {filtered.slice(0, 50).map(room => {
                  const label = formatRoomLabel(room);
                  const sub = room.floor
                    ? [room.floor.building?.name, room.floor.name].filter(Boolean).join(' · ')
                    : '';
                  return (
                    <CommandItem
                      key={room.id}
                      value={room.id}
                      onSelect={() => selectLabel(label)}
                    >
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="truncate text-sm">{label}</span>
                        {sub && (
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1 truncate">
                            <Building className="h-3 w-3" />
                            {sub}
                          </span>
                        )}
                      </div>
                      {value === label && <Check className="ml-2 h-4 w-4 shrink-0" />}
                    </CommandItem>
                  );
                })}
                {filtered.length > 50 && (
                  <div className="py-2 px-3 text-[11px] text-muted-foreground text-center">
                    Showing first 50. Keep typing to narrow.
                  </div>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
