
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { FormItem, FormLabel } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface BuildingSelectorProps {
  value: string;
  onSelect: (value: string) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BuildingSelector({ value, onSelect, isOpen, onOpenChange }: BuildingSelectorProps) {
  const { data: buildings, isLoading } = useQuery({
    queryKey: ["buildings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("buildings")
        .select("*")
        .eq('status', 'active')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const selectedBuilding = buildings?.find(b => b.id === value);

  return (
    <FormItem className="flex flex-col">
      <FormLabel>Building</FormLabel>
      <Popover open={isOpen} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            aria-label="Select a building"
            className={cn(
              "w-full justify-between bg-background",
              !value && "text-muted-foreground"
            )}
          >
            {isLoading ? (
              "Loading buildings..."
            ) : (
              selectedBuilding?.name || "Select a building"
            )}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[400px] p-0" 
          align="start"
          side="bottom"
          sideOffset={5}
        >
          <Command className="w-full">
            <CommandInput 
              placeholder="Search buildings..." 
              className="h-9"
            />
            <CommandList>
              <CommandEmpty>No buildings found.</CommandEmpty>
              <CommandGroup>
                {buildings?.map((building) => (
                  <CommandItem
                    key={building.id}
                    value={building.id}
                    className="cursor-pointer"
                    onSelect={() => {
                      onSelect(building.id);
                      onOpenChange(false);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Check
                        className={cn(
                          "h-4 w-4",
                          value === building.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span>{building.name}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </FormItem>
  );
}
