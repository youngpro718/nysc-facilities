import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Building {
  id: string;
  name: string;
}

interface BuildingFilterBarProps {
  buildings: Building[];
  selectedBuildingId: string | null;
  onSelect: (buildingId: string | null) => void;
}

/**
 * Compact pill-style building filter used at the top of facility pages.
 * Selecting "All Buildings" clears the filter (passes null).
 */
export function BuildingFilterBar({
  buildings,
  selectedBuildingId,
  onSelect,
}: BuildingFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 p-3 sm:p-4 border rounded-lg bg-muted/50">
      <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className="text-xs sm:text-sm font-medium text-muted-foreground whitespace-nowrap">
        Building:
      </span>
      <div className="flex flex-wrap gap-2">
        <Button
          variant={!selectedBuildingId ? "default" : "outline"}
          size="sm"
          onClick={() => onSelect(null)}
          className="text-xs sm:text-sm"
        >
          All Buildings
        </Button>
        {buildings.map((building) => (
          <Button
            key={building.id}
            variant={selectedBuildingId === building.id ? "default" : "outline"}
            size="sm"
            onClick={() => onSelect(building.id)}
            className="text-xs sm:text-sm"
          >
            {building.name}
          </Button>
        ))}
      </div>
    </div>
  );
}
