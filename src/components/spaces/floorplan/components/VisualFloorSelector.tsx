import { Building2, ChevronRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Floor {
  id: string;
  name: string;
  floor_number: number;
  buildings?: {
    name: string;
  };
}

interface VisualFloorSelectorProps {
  floors: Floor[];
  selectedFloorId: string | null;
  onFloorSelect: (floorId: string) => void;
}

export function VisualFloorSelector({
  floors,
  selectedFloorId,
  onFloorSelect,
}: VisualFloorSelectorProps) {
  // Group floors by building
  const floorsByBuilding = floors.reduce((acc, floor) => {
    const buildingName = floor.buildings?.name || 'Unknown Building';
    if (!acc[buildingName]) {
      acc[buildingName] = [];
    }
    acc[buildingName].push(floor);
    return acc;
  }, {} as Record<string, Floor[]>);

  return (
    <ScrollArea className="h-[400px]">
      <div className="p-4 space-y-4">
        {Object.entries(floorsByBuilding).map(([buildingName, buildingFloors]) => (
          <div key={buildingName} className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span>{buildingName}</span>
            </div>
            <div className="space-y-1 pl-6">
              {buildingFloors
                .sort((a, b) => b.floor_number - a.floor_number) // Sort floors in descending order
                .map((floor) => (
                  <button
                    key={floor.id}
                    onClick={() => onFloorSelect(floor.id)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors
                      ${selectedFloorId === floor.id 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-accent'
                      }`}
                  >
                    <ChevronRight className="h-4 w-4" />
                    <span>{floor.name}</span>
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
} 