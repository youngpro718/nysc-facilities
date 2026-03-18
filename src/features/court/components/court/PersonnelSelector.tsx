import { useState } from "react";
import { Check, ChevronsUpDown, User, Phone, MapPin, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { PersonnelOption } from "@features/court/hooks/useCourtPersonnel";
import { PersonnelWithAvailability, GroupedPersonnel } from "@features/court/hooks/usePersonnelAvailability";

interface PersonnelSelectorProps {
  value: string | string[];
  onValueChange: (value: string | string[]) => void;
  personnel: PersonnelOption[];
  placeholder?: string;
  multiple?: boolean;
  role?: 'judge' | 'clerk' | 'sergeant' | 'all';
  disabled?: boolean;
  className?: string;
  allowCustom?: boolean;
  allowClear?: boolean;
  /** If provided, personnel are grouped by availability status */
  availabilityData?: GroupedPersonnel;
  /** Called when an assigned person is selected — parent can show a reason prompt */
  onAssignedPersonSelected?: (person: PersonnelWithAvailability) => void;
}

export const PersonnelSelector = ({
  value,
  onValueChange,
  personnel,
  placeholder = "Select personnel...",
  multiple = false,
  role = 'all',
  disabled = false,
  className,
  allowCustom = true,
  allowClear = true,
  availabilityData,
  onAssignedPersonSelected,
}: PersonnelSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  // Filter personnel by role if specified (only used when no availabilityData)
  const filteredPersonnel = personnel.filter(person => {
    if (role === 'all') return true;
    const personRole = person.role.toLowerCase();
    switch (role) {
      case 'judge':
        return personRole.includes('judge') || personRole.includes('justice') || personRole === 'administrative_judge';
      case 'clerk':
        return personRole.includes('clerk');
      case 'sergeant':
        return personRole.includes('sergeant') || personRole.includes('officer') || personRole === 'captain' || personRole === 'major';
      default:
        return true;
    }
  });

  // Get selected personnel for display
  const allPersonnelForLookup = availabilityData
    ? [...availabilityData.available, ...availabilityData.assigned, ...availabilityData.absent]
    : filteredPersonnel;

  const getSelectedPersonnel = () => {
    if (multiple && Array.isArray(value)) {
      return allPersonnelForLookup.filter(person => value.includes(person.name));
    } else if (!multiple && typeof value === 'string') {
      return allPersonnelForLookup.find(person => person.name === value);
    }
    return null;
  };

  // Handle selection
  const handleSelect = (selectedPerson: PersonnelOption | PersonnelWithAvailability) => {
    // If availability-aware and person is assigned, notify parent
    if (availabilityData && 'availability' in selectedPerson && selectedPerson.availability === 'assigned' && onAssignedPersonSelected) {
      onAssignedPersonSelected(selectedPerson as PersonnelWithAvailability);
      // Don't close — parent will handle via the reason dialog
      return;
    }

    if (multiple && Array.isArray(value)) {
      const newValue = value.includes(selectedPerson.name)
        ? value.filter(name => name !== selectedPerson.name)
        : [...value, selectedPerson.name];
      onValueChange(newValue);
    } else {
      onValueChange(selectedPerson.name);
      setOpen(false);
    }
  };

  const handleAddCustom = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (multiple && Array.isArray(value)) {
      const set = new Set(value);
      set.add(trimmed);
      onValueChange(Array.from(set));
    } else {
      onValueChange(trimmed);
      setOpen(false);
    }
  };

  // Render selected value display
  const renderSelectedValue = () => {
    if (multiple && Array.isArray(value)) {
      const selectedPersonnel = getSelectedPersonnel() as PersonnelOption[];
      if (selectedPersonnel && selectedPersonnel.length > 0) {
        return (
          <div className="flex flex-wrap gap-1">
            {selectedPersonnel.map(person => (
              <Badge key={person.id} variant="secondary" className="text-xs flex items-center gap-1 pr-1">
                <span>{person.name}</span>
                <div
                  className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5 transition-colors cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (Array.isArray(value)) {
                      onValueChange(value.filter(name => name !== person.name));
                    }
                  }}
                  aria-label={`Remove ${person.name}`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      if (Array.isArray(value)) {
                        onValueChange(value.filter(name => name !== person.name));
                      }
                    }
                  }}
                >
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </div>
              </Badge>
            ))}
          </div>
        );
      }
    } else {
      const selectedPerson = getSelectedPersonnel() as PersonnelOption;
      if (selectedPerson) {
        return (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>{selectedPerson.name}</span>
            {selectedPerson.judgeStatus === 'jho' ? (
              <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                JHO
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs">
                {selectedPerson.role}
              </Badge>
            )}
          </div>
        );
      }
    }
    return <span className="text-muted-foreground">{placeholder}</span>;
  };

  // Render a single personnel item row
  const renderPersonnelItem = (person: PersonnelOption | PersonnelWithAvailability) => {
    const isSelected = multiple && Array.isArray(value)
      ? value.includes(person.name)
      : value === person.name;
    const avail = 'availability' in person ? person as PersonnelWithAvailability : null;

    return (
      <CommandItem
        key={person.id}
        value={person.name}
        onSelect={() => handleSelect(person)}
        className={cn(
          "flex items-center justify-between p-3",
          avail?.availability === 'absent' && "opacity-50"
        )}
      >
        <div className="flex items-center space-x-3 flex-1">
          <User className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <div className="font-medium flex items-center gap-1.5">
              {person.name}
              {person.judgeStatus === 'jho' && (
                <Badge variant="secondary" className="text-[10px] px-1 py-0 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                  JHO
                </Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
              {/* Show assignment info if available */}
              {avail?.availability === 'assigned' && avail.currentAssignments && (
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  {avail.currentAssignments.map(a =>
                    `${a.part || 'No Part'} · Room ${a.roomNumber}`
                  ).join(', ')}
                </span>
              )}
              {avail?.availability === 'absent' && (
                <span className="text-xs text-destructive font-medium">
                  {avail.absenceReason || 'Out today'}
                  {avail.absenceEndDate && ` (until ${avail.absenceEndDate})`}
                </span>
              )}
              {/* Fallback: show role/phone/room for non-availability mode */}
              {!avail && (
                <>
                  <Badge variant="outline" className="text-xs">
                    {person.judgeStatus === 'jho' ? 'Judicial Hearing Officer' : person.role}
                  </Badge>
                  {person.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {person.phone}
                      {person.extension && ` ext. ${person.extension}`}
                    </span>
                  )}
                  {person.room && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Room {person.room}
                      {person.floor && `, Floor ${person.floor}`}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        <Check className={cn("ml-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
      </CommandItem>
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between min-h-[40px]", className)}
          disabled={disabled}
        >
          <div className="flex-1 text-left overflow-hidden">
            {renderSelectedValue()}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput
            placeholder={`Search ${role === 'all' ? 'personnel' : role + 's'}...`}
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandEmpty>No personnel found.</CommandEmpty>

          {/* Custom entry + clear */}
          {(allowCustom && searchValue.trim().length > 0) || (allowClear && ((multiple && Array.isArray(value) && value.length > 0) || (!multiple && typeof value === 'string' && value))) ? (
            <CommandGroup>
              {allowCustom && searchValue.trim().length > 0 && (
                <CommandItem
                  key={`custom-${searchValue}`}
                  value={searchValue}
                  onSelect={() => handleAddCustom(searchValue)}
                  className="flex items-center justify-between p-3 text-primary"
                >
                  Add "{searchValue}"
                </CommandItem>
              )}
              {allowClear && ((multiple && Array.isArray(value) && value.length > 0) || (!multiple && typeof value === 'string' && value)) && (
                <CommandItem
                  key="clear-selection"
                  value="__clear__"
                  onSelect={() => {
                    onValueChange(multiple ? [] : '');
                    setSearchValue('');
                  }}
                  className="flex items-center justify-between p-3 text-destructive"
                >
                  Clear selection
                </CommandItem>
              )}
            </CommandGroup>
          ) : null}

          {/* Availability-grouped mode */}
          {availabilityData ? (
            <div className="max-h-[300px] overflow-y-auto">
              {availabilityData.available.length > 0 && (
                <CommandGroup heading={
                  <span className="flex items-center gap-1.5">
                    <Circle className="h-2.5 w-2.5 fill-emerald-500 text-emerald-500" />
                    Available ({availabilityData.available.length})
                  </span>
                }>
                  {availabilityData.available.map(renderPersonnelItem)}
                </CommandGroup>
              )}
              {availabilityData.assigned.length > 0 && (
                <CommandGroup heading={
                  <span className="flex items-center gap-1.5">
                    <Circle className="h-2.5 w-2.5 fill-blue-500 text-blue-500" />
                    Currently Assigned ({availabilityData.assigned.length})
                  </span>
                }>
                  {availabilityData.assigned.map(renderPersonnelItem)}
                </CommandGroup>
              )}
              {availabilityData.absent.length > 0 && (
                <CommandGroup heading={
                  <span className="flex items-center gap-1.5">
                    <Circle className="h-2.5 w-2.5 fill-destructive text-destructive" />
                    Out Today ({availabilityData.absent.length})
                  </span>
                }>
                  {availabilityData.absent.map(renderPersonnelItem)}
                </CommandGroup>
              )}
            </div>
          ) : (
            <CommandGroup className="max-h-[300px] overflow-y-auto">
              {filteredPersonnel.map(renderPersonnelItem)}
            </CommandGroup>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
};
