import { useState } from "react";
import { Check, ChevronsUpDown, User, Phone, MapPin } from "lucide-react";
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
import { PersonnelOption } from "@/hooks/useCourtPersonnel";

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
}: PersonnelSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  // Filter personnel by role if specified
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
  const getSelectedPersonnel = () => {
    if (multiple && Array.isArray(value)) {
      return filteredPersonnel.filter(person => value.includes(person.name));
    } else if (!multiple && typeof value === 'string') {
      return filteredPersonnel.find(person => person.name === value);
    }
    return null;
  };

  // Handle selection
  const handleSelect = (selectedPerson: PersonnelOption) => {
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
                      const newValue = value.filter(name => name !== person.name);
                      onValueChange(newValue);
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
                        const newValue = value.filter(name => name !== person.name);
                        onValueChange(newValue);
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
            <Badge variant="outline" className="text-xs">
              {selectedPerson.role}
            </Badge>
          </div>
        );
      }
    }
    return <span className="text-muted-foreground">{placeholder}</span>;
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
          <CommandGroup className="max-h-[300px] overflow-y-auto">
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
            {filteredPersonnel.map((person) => {
              const isSelected = multiple && Array.isArray(value) 
                ? value.includes(person.name)
                : value === person.name;

              return (
                <CommandItem
                  key={person.id}
                  value={person.name}
                  onSelect={() => handleSelect(person)}
                  className="flex items-center justify-between p-3"
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="font-medium">{person.name}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {person.role}
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
                      </div>
                    </div>
                  </div>
                  <Check
                    className={cn(
                      "ml-2 h-4 w-4",
                      isSelected ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              );
            })}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
