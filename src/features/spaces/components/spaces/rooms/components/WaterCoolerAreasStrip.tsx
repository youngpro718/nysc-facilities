import { useQuery } from "@tanstack/react-query";
import { DropletIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { fetchCommonAreas } from "../../services/commonAreas";
import { commonAreaTypeLabel } from "../../common-areas/types";

interface WaterCoolerAreasStripProps {
  buildingId: string;
  floorId: string;
}

/**
 * Surfaces common areas (hallways, mezzanines, stairwells, etc.) that have a
 * water cooler when the Rooms page's water-cooler filter is active. Rooms
 * and common areas are different tables/entities, so this renders as its
 * own visually distinct strip rather than being merged into the room grid —
 * full editing for these still lives on the Common Areas tab.
 */
export function WaterCoolerAreasStrip({ buildingId, floorId }: WaterCoolerAreasStripProps) {
  const { data: areas } = useQuery({
    queryKey: ["common-areas-water-coolers", buildingId, floorId],
    queryFn: () => fetchCommonAreas(buildingId === "all" ? undefined : buildingId, floorId === "all" ? undefined : floorId),
    staleTime: 5 * 60 * 1000,
  });

  const coolerAreas = (areas ?? []).filter((area) => area.water_cooler_count > 0);
  if (coolerAreas.length === 0) return null;

  return (
    <div className="shrink-0 rounded-lg border border-amber-300/60 bg-amber-50 p-3 dark:border-amber-800/60 dark:bg-amber-950/20">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-amber-800 dark:text-amber-300">
        <DropletIcon className="h-3.5 w-3.5" />
        Common areas with water coolers ({coolerAreas.length})
      </div>
      <div className="flex flex-wrap gap-2">
        {coolerAreas.map((area) => (
          <div
            key={area.id}
            className="flex items-center gap-2 rounded-md border border-amber-200 bg-white px-2.5 py-1.5 text-sm dark:border-amber-900 dark:bg-amber-950/40"
          >
            <Badge variant="outline" className="border-amber-400 text-amber-800 dark:border-amber-700 dark:text-amber-300">
              Common Area
            </Badge>
            <span className="font-medium">{area.name}</span>
            <span className="text-muted-foreground">
              {area.floor.building.name} · {area.floor.name} · {commonAreaTypeLabel(area.area_type)}
            </span>
            <span className="text-muted-foreground">
              {area.water_cooler_count} {area.water_cooler_count === 1 ? "cooler" : "coolers"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
