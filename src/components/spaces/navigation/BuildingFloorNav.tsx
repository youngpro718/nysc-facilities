
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Building2, Layers } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface BuildingFloorNavProps {
  selectedBuilding: string;
  selectedFloor: string;
  onBuildingChange: (building: string) => void;
  onFloorChange: (floor: string) => void;
}

export function BuildingFloorNav({
  selectedBuilding,
  selectedFloor,
  onBuildingChange,
  onFloorChange,
}: BuildingFloorNavProps) {
  const [isBuildingOpen, setIsBuildingOpen] = useState(false);
  const [isFloorOpen, setIsFloorOpen] = useState(false);

  const { data: buildings, isLoading: isBuildingsLoading } = useQuery({
    queryKey: ['buildings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('buildings')
        .select('*')
        .eq('status', 'active')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const { data: floors, isLoading: isFloorsLoading } = useQuery({
    queryKey: ['floors', selectedBuilding],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('floors')
        .select('*')
        .eq('building_id', selectedBuilding)
        .eq('status', 'active')
        .order('floor_number');
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedBuilding && selectedBuilding !== 'all',
  });

  if (isBuildingsLoading) {
    return <Skeleton className="h-20 w-full" />;
  }

  return (
    <Card className="p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Building</span>
          </div>
          <Popover open={isBuildingOpen} onOpenChange={setIsBuildingOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={isBuildingOpen}
                className="w-[200px] justify-between"
              >
                <span className={cn("truncate", !selectedBuilding && "text-muted-foreground")}>
                  {selectedBuilding === "all" 
                    ? "All Buildings" 
                    : buildings?.find(b => b.id === selectedBuilding)?.name || "Select building"}
                </span>
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandInput placeholder="Search buildings..." />
                <CommandList>
                  <CommandEmpty>No building found.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value="all"
                      onSelect={() => {
                        onBuildingChange("all");
                        setIsBuildingOpen(false);
                      }}
                    >
                      All Buildings
                      {selectedBuilding === "all" && (
                        <Check className="ml-auto h-4 w-4" />
                      )}
                    </CommandItem>
                    {buildings?.map((building) => (
                      <CommandItem
                        key={building.id}
                        value={building.id}
                        onSelect={() => {
                          onBuildingChange(building.id);
                          setIsBuildingOpen(false);
                        }}
                      >
                        {building.name}
                        {selectedBuilding === building.id && (
                          <Check className="ml-auto h-4 w-4" />
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Floor</span>
          </div>
          <Popover 
            open={isFloorOpen} 
            onOpenChange={setIsFloorOpen}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={isFloorOpen}
                className="w-[200px] justify-between"
                disabled={!selectedBuilding || selectedBuilding === 'all' || isFloorsLoading}
                aria-disabled={!selectedBuilding || selectedBuilding === 'all' || isFloorsLoading}
                aria-busy={isFloorsLoading}
              >
                <span className={cn("truncate", !selectedFloor && "text-muted-foreground")}>
                  {selectedFloor === "all" 
                    ? "All Floors" 
                    : floors?.find(f => f.id === selectedFloor)?.name || "Select floor"}
                </span>
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandInput placeholder="Search floors..." />
                <CommandList>
                  <CommandEmpty>No floor found.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value="all"
                      onSelect={() => {
                        onFloorChange("all");
                        setIsFloorOpen(false);
                      }}
                    >
                      All Floors
                      {selectedFloor === "all" && (
                        <Check className="ml-auto h-4 w-4" />
                      )}
                    </CommandItem>
                    {floors?.map((floor) => (
                      <CommandItem
                        key={floor.id}
                        value={floor.id}
                        onSelect={() => {
                          onFloorChange(floor.id);
                          setIsFloorOpen(false);
                        }}
                      >
                        {floor.name}
                        {selectedFloor === floor.id && (
                          <Check className="ml-auto h-4 w-4" />
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {/* Helper caption for clarity */}
          {(!selectedBuilding || selectedBuilding === 'all') && (
            <p className="text-xs text-muted-foreground">Select a building to enable floor selection.</p>
          )}
          {isFloorsLoading && selectedBuilding && selectedBuilding !== 'all' && (
            <p className="text-xs text-muted-foreground">Loading floors…</p>
          )}
        </div>
      </div>
    </Card>
  );
}
