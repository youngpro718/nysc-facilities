
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

export function FloorSelector({ 
  form, 
  selectedBuildingId, 
  isOpen, 
  onOpenChange 
}: FloorSelectorProps) {
  const { data: floors, isLoading: floorsLoading } = useQuery({
    queryKey: ["floors", selectedBuildingId],
    queryFn: async () => {
      console.log("Fetching floors for building:", selectedBuildingId);
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
      if (error) {
        console.error("Error fetching floors:", error);
        throw error;
      }
      console.log("Floors fetched:", data);
      return data;
    },
    enabled: true
  });

  const handleFloorSelect = (floorValue: string) => {
    console.log("Floor selection value:", floorValue);
    const floor = floors?.find(f => 
      `${f.name} ${f.floor_number}`.toLowerCase() === floorValue.toLowerCase()
    );
    console.log("Found floor:", floor);

    if (floor) {
      form.setValue("floorId", floor.id);
      onOpenChange(false);
    }
  };

  return (
    <FormField
      control={form.control}
      name="floorId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Floor</FormLabel>
          <Popover open={isOpen} onOpenChange={onOpenChange}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={isOpen}
                className="w-full justify-between"
                disabled={!selectedBuildingId}
              >
                {floorsLoading ? (
                  <span className="text-muted-foreground">Loading floors...</span>
                ) : (
                  <span className={cn("truncate", !field.value && "text-muted-foreground")}>
                    {field.value
                      ? floors?.find(f => f.id === field.value)
                        ? `Floor ${floors.find(f => f.id === field.value)?.floor_number} (${floors.find(f => f.id === field.value)?.name})`
                        : "Select a floor"
                      : "Select a floor"}
                  </span>
                )}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0">
              <Command>
                <CommandInput placeholder="Search floors..." />
                <CommandList>
                  <CommandEmpty>No floor found.</CommandEmpty>
                  <CommandGroup>
                    {floors?.map((floor) => (
                      <CommandItem
                        key={floor.id}
                        value={`${floor.name} ${floor.floor_number}`}
                        onSelect={handleFloorSelect}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            field.value === floor.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        Floor {floor.floor_number} ({floor.name})
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
