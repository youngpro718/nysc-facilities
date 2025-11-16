import { BuildingCard } from "./BuildingCard";
import { BuildingCardSkeleton } from "./BuildingCardSkeleton";
import { calculateBuildingStats } from "@/utils/dashboardUtils";
import { Building } from "@/types/dashboard";

export interface Issue {
  id: string;
  title: string;
  description: string;
  building_id: string;
  photos?: string[];
  created_at: string;
  seen: boolean;
  status: string;
}

export interface Activity {
  id: string;
  action: string;
  performed_by?: string;
  created_at: string;
  metadata?: {
    building_id: string;
    [key: string]: any;
  };
}

interface BuildingsGridProps {
  buildings: Building[];
  isLoading: boolean;
  issues: Issue[];
  activities: Activity[];
  onMarkAsSeen: (id: string) => void;
}

const buildingImages = [
  "/lovable-uploads/aed346ca-c3c6-4e0c-b236-528b0e54e20c.webp",
  "/lovable-uploads/83d441a4-13af-461a-800b-3b483c153ed4.webp",
];

export function BuildingsGrid({
  buildings,
  isLoading,
  issues,
  activities,
  onMarkAsSeen,
}: BuildingsGridProps) {
  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        {[1, 2].map((i) => (
          <BuildingCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {buildings?.filter(building => building != null && building.id)?.map((building, index) => {
        const { floorCount, roomCount, workingFixtures, totalFixtures } = calculateBuildingStats(building);

        // Prefer precomputed values from the loader if present
        const effectiveWorking = typeof (building as any).lightingWorkingFixtures === 'number'
          ? (building as any).lightingWorkingFixtures
          : workingFixtures;
        const effectiveTotal = typeof (building as any).lightingTotalFixtures === 'number'
          ? (building as any).lightingTotalFixtures
          : totalFixtures;

        // Debug: log computed lighting counts per building
        try {
          // eslint-disable-next-line no-console
          console.debug('LightingCounts', {
            buildingId: building.id,
            buildingName: (building as any)?.name,
            effectiveWorking,
            effectiveTotal,
            _lightingDebug: (building as any)?._lightingDebug,
          });
        } catch {}

        const buildingIssues =
          issues?.filter(
            (issue) =>
              issue.building_id === building.id && 
              issue.status !== 'resolved'
          ) || [];

        const buildingActivities =
          activities?.filter((activity) => {
            if (activity.metadata && typeof activity.metadata === "object") {
              return activity.metadata.building_id === building.id;
            }
            return false;
          }) || [];

        return (
          <BuildingCard
            key={building.id}
            building={building}
            buildingImage={buildingImages[index % buildingImages.length]}
            floorCount={floorCount}
            roomCount={roomCount}
            workingFixtures={effectiveWorking}
            totalFixtures={effectiveTotal}
            buildingIssues={buildingIssues}
            buildingActivities={buildingActivities}
            onMarkAsSeen={onMarkAsSeen}
          />
        );
      })}
    </div>
  );
}
