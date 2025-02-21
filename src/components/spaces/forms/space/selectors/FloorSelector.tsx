
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronDown } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { CreateSpaceFormData } from "../../../schemas/createSpaceSchema";

interface FloorSelectorProps {
  form: UseFormReturn<CreateSpaceFormData>;
  selectedBuildingId: string | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FloorSelector({ form, selectedBuildingId, isOpen, onOpenChange }: FloorSelectorProps) {
  const { data: floors, isLoading } = useQuery({
    queryKey: ["floors", selectedBuildingId],
    queryFn: async () => {
      const query = supabase
        .from("floors")
        .select(`
          id,
          name,
          floor_number,
          building_id,
          buildings (
            id,
            name
          )
        `)
        .eq('status', 'active');

      if (selectedBuildingId) {
        query.eq('building_id', selectedBuildingId);
      }
      
      const { data, error } = await query.order('floor_number');
      if (error) throw error;
      return data;
    },
    enabled: !!selectedBuildingId
  });

  return (
    <FormField
      control={form.control}
      name="floorId"
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>Floor</FormLabel>
          <Popover open={isOpen} onOpenChange={onOpenChange}>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={isOpen}
                  disabled={!selectedBuildingId}
                  className={cn(
                    "w-full justify-between bg-background",
                    !field.value && "text-muted-foreground"
                  )}
                >
                  {isLoading ? (
                    "Loading floors..."
                  ) : (
                    field.value
                      ? floors?.find(f => f.id === field.value)
                        ? `Floor ${floors.find(f => f.id === field.value)?.floor_number} (${floors.find(f => f.id === field.value)?.name})`
                        : "Select a floor"
                      : "Select a floor"
                  )}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent 
              className="w-[400px] p-0" 
              align="start"
              side="bottom"
              sideOffset={5}
            >
              <Command className="w-full">
                <CommandInput 
                  placeholder="Search floors..." 
                  className="h-9"
                />
                <CommandList>
                  <CommandEmpty>No floors found.</CommandEmpty>
                  <CommandGroup>
                    {floors?.map((floor) => (
                      <CommandItem
                        key={floor.id}
                        value={floor.id}
                        className="cursor-pointer"
                        onSelect={() => {
                          form.setValue("floorId", floor.id);
                          onOpenChange(false);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <Check
                            className={cn(
                              "h-4 w-4",
                              field.value === floor.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <span>Floor {floor.floor_number} ({floor.name})</span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
