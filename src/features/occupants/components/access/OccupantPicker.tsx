import { useMemo, useState } from 'react';
import { Check, ChevronsUpDown, User } from 'lucide-react';
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
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface OccupantRow {
  id: string;
  first_name: string;
  last_name: string;
  department: string | null;
}

interface OccupantPickerProps {
  value: string;
  onChange: (occupantId: string, label: string) => void;
  placeholder?: string;
}

/**
 * Searchable occupant picker backed by the `occupants` table (the building
 * directory — distinct from `profiles`/`personnel_profiles`). Access
 * Management's departure flow needs an `occupants.id`, which nobody can type
 * from memory, so this replaces a raw-UUID text box.
 */
export function OccupantPicker({ value, onChange, placeholder = 'Search occupants…' }: OccupantPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { data: occupants = [], isLoading } = useQuery({
    queryKey: ['occupants-for-picker'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('occupants')
        .select('id, first_name, last_name, department')
        .order('last_name', { ascending: true });
      if (error) throw error;
      return (data || []) as OccupantRow[];
    },
  });

  const selected = useMemo(() => occupants.find(o => o.id === value), [occupants, value]);
  const selectedLabel = selected ? `${selected.first_name} ${selected.last_name}` : '';

  const filtered = useMemo(() => {
    if (!search.trim()) return occupants;
    const q = search.toLowerCase();
    return occupants.filter(o =>
      `${o.first_name} ${o.last_name}`.toLowerCase().includes(q) ||
      (o.department ?? '').toLowerCase().includes(q)
    );
  }, [occupants, search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between h-11 font-normal', !value && 'text-muted-foreground')}
        >
          <span className="flex items-center gap-2 min-w-0 truncate">
            <User className="h-4 w-4 shrink-0 opacity-60" />
            <span className="truncate">{selectedLabel || placeholder}</span>
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] min-w-[300px] p-0" align="start" sideOffset={4}>
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search by name or department…" value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>{isLoading ? 'Loading occupants…' : `No occupants found for "${search}"`}</CommandEmpty>
            <CommandGroup>
              {filtered.slice(0, 50).map(o => {
                const label = `${o.first_name} ${o.last_name}`;
                return (
                  <CommandItem
                    key={o.id}
                    value={o.id}
                    onSelect={() => {
                      onChange(o.id, label);
                      setOpen(false);
                      setSearch('');
                    }}
                  >
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="truncate text-sm">{label}</span>
                      {o.department && (
                        <span className="text-[11px] text-muted-foreground truncate">{o.department}</span>
                      )}
                    </div>
                    {value === o.id && <Check className="ml-2 h-4 w-4 shrink-0" />}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
