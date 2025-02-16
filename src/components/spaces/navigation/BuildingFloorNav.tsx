
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Building2, ArrowDownToLine } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

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
          <Select value={selectedBuilding} onValueChange={onBuildingChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select building" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Buildings</SelectItem>
              {buildings?.map((building) => (
                <SelectItem key={building.id} value={building.id}>
                  {building.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <ArrowDownToLine className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Floor</span>
          </div>
          <Select 
            value={selectedFloor} 
            onValueChange={onFloorChange}
            disabled={!selectedBuilding || selectedBuilding === 'all' || isFloorsLoading}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select floor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Floors</SelectItem>
              {floors?.map((floor) => (
                <SelectItem key={floor.id} value={floor.id}>
                  {floor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  );
}
