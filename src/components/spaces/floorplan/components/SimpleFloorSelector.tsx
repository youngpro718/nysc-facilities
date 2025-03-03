import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SimpleFloorSelectorProps {
  selectedFloorId: string | null;
  onFloorSelect: (floorId: string) => void;
}

interface Floor {
  id: string;
  name: string;
  building_id: string;
  floor_number: number;
  building: {
    name: string;
  } | null;
}

interface GroupedFloors {
  [buildingName: string]: Floor[];
}

export function SimpleFloorSelector({
  selectedFloorId,
  onFloorSelect,
}: SimpleFloorSelectorProps) {
  const { data: floors, isLoading } = useQuery({
    queryKey: ["floors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("floors")
        .select("id, name, building_id, floor_number, building:buildings(name)")
        .order("floor_number", { ascending: false });

      if (error) throw error;
      return data as Floor[];
    },
  });

  // Group floors by building
  const groupedFloors = floors?.reduce<GroupedFloors>((acc, floor) => {
    const buildingName = floor.building?.name || "Uncategorized";
    if (!acc[buildingName]) {
      acc[buildingName] = [];
    }
    acc[buildingName].push(floor);
    return acc;
  }, {});

  if (isLoading) {
    return (
      <Select disabled>
        <SelectTrigger className="w-[250px]">
          <SelectValue placeholder="Loading floors..." />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select
      value={selectedFloorId || undefined}
      onValueChange={onFloorSelect}
    >
      <SelectTrigger className="w-[250px]">
        <SelectValue placeholder="Select a floor" />
      </SelectTrigger>
      <SelectContent>
        {groupedFloors && Object.entries(groupedFloors).map(([buildingName, buildingFloors], index) => (
          <div key={buildingName}>
            {index > 0 && <SelectSeparator />}
            <SelectGroup>
              <SelectLabel className="font-semibold">{buildingName}</SelectLabel>
              {buildingFloors.map((floor) => (
                <SelectItem key={floor.id} value={floor.id}>
                  {floor.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </div>
        ))}
      </SelectContent>
    </Select>
  );
} 