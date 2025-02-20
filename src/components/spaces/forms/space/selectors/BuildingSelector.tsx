
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
  const { data: buildings, isLoading: buildingsLoading } = useQuery({
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

  const handleBuildingSelect = (buildingName: string) => {
    console.log("Building selected:", buildingName);
    const building = buildings?.find(b => b.name.toLowerCase() === buildingName.toLowerCase());
    console.log("Found building:", building);
    
    if (building) {
      onBuildingSelect(building.id);
    }
  };

  return (
    <FormItem>
      <FormLabel>Building</FormLabel>
      <Popover open={isOpen} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            className="w-full justify-between"
          >
            {buildingsLoading ? (
              <span className="text-muted-foreground">Loading buildings...</span>
            ) : (
              <span className={cn("truncate", !selectedBuildingId && "text-muted-foreground")}>
                {selectedBuildingId
                  ? buildings?.find(b => b.id === selectedBuildingId)?.name
                  : "Select a building"}
              </span>
            )}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0">
          <Command>
            <CommandInput placeholder="Search buildings..." />
            <CommandList>
              <CommandEmpty>No building found.</CommandEmpty>
              <CommandGroup>
                {buildings?.map((building) => (
                  <CommandItem
                    key={building.id}
                    value={building.name}
                    onSelect={handleBuildingSelect}
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
    </FormItem>
  );
}
