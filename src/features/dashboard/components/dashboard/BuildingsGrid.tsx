import { BuildingCard } from "./BuildingCard";
import { BuildingCardSkeleton } from "./BuildingCardSkeleton";
import { logger } from "@/lib/logger";
import { calculateBuildingStats } from "@/utils/dashboardUtils";
import type { Building } from "@/types/dashboard";
import type { BuildingWithLighting } from "@/utils/dashboardUtils";

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
    [key: string]: unknown;
  };
}

interface BuildingsGridProps {
  buildings: BuildingWithLighting[];
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
        const effectiveWorking = typeof building.lightingWorkingFixtures === 'number'
          ? building.lightingWorkingFixtures
          : workingFixtures;
        const effectiveTotal = typeof building.lightingTotalFixtures === 'number'
          ? building.lightingTotalFixtures
          : totalFixtures;

        // Debug: log computed lighting counts per building
        try {
          logger.debug('LightingCounts', {
            buildingId: building.id,
            buildingName: building?.name,
            effectiveWorking,
            effectiveTotal,
            _lightingDebug: building?._lightingDebug,
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

        // Dynamic photo feature: Use the most recent issue photo if available
        let dynamicImage = buildingImages[index % buildingImages.length];
        
        // Find the most recent issue with a photo
        const issuesWithPhotos = buildingIssues
          .filter(issue => issue.photos && issue.photos.length > 0)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        if (issuesWithPhotos.length > 0 && issuesWithPhotos[0].photos && issuesWithPhotos[0].photos.length > 0) {
          dynamicImage = issuesWithPhotos[0].photos[0];
        }

        return (
          <BuildingCard
            key={building.id}
            building={building}
            buildingImage={dynamicImage}
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
