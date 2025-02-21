
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { FormItem, FormLabel } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface BuildingSelectorProps {
  selectedBuildingId: string | null;
  onBuildingSelect: (buildingId: string) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BuildingSelector({ 
  selectedBuildingId, 
  onBuildingSelect, 
  isOpen, 
  onOpenChange 
}: BuildingSelectorProps) {
  const { data: buildings, isLoading: buildingsLoading, error } = useQuery({
    queryKey: ["buildings"],
    queryFn: async () => {
      console.log("Fetching buildings...");
      const { data, error } = await supabase
        .from("buildings")
        .select("*")
        .eq('status', 'active')
        .order('name');
      
      if (error) {
        console.error("Error fetching buildings:", error);
        throw error;
      }
      console.log("Buildings fetched:", data);
      return data;
    }
  });

  // Handle direct building selection by ID
  const handleBuildingSelect = (buildingId: string) => {
    console.log("Building selected:", buildingId);
    onBuildingSelect(buildingId);
  };

  const selectedBuilding = buildings?.find(b => b.id === selectedBuildingId);

  return (
    <FormItem>
      <FormLabel>Building</FormLabel>
      <Popover open={isOpen} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            aria-label="Select a building"
            className={cn(
              "w-full justify-between",
              error ? "border-red-500" : ""
            )}
          >
            {buildingsLoading ? (
              <span className="text-muted-foreground">Loading buildings...</span>
            ) : (
              <span className={cn(
                "truncate",
                !selectedBuildingId && "text-muted-foreground",
                error && "text-red-500"
              )}>
                {selectedBuilding?.name || "Select a building"}
              </span>
            )}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0">
          <Command>
            <CommandInput 
              placeholder="Search buildings..."
              aria-label="Search buildings" 
            />
            <CommandList>
              <CommandEmpty>No buildings found.</CommandEmpty>
              <CommandGroup>
                {buildings?.map((building) => (
                  <CommandItem
                    key={building.id}
                    value={building.id}
                    onSelect={() => handleBuildingSelect(building.id)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedBuildingId === building.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {building.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error && (
        <p className="text-sm text-red-500 mt-1">
          Error loading buildings. Please try again.
        </p>
      )}
    </FormItem>
  );
}
