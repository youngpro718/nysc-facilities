
import { BuildingCard } from "./BuildingCard";
import { BuildingCardSkeleton } from "./BuildingCardSkeleton";
import { calculateBuildingStats } from "@/utils/dashboardUtils";

const buildingImages = [
  "/lovable-uploads/aed346ca-c3c6-4e0c-b236-528b0e54e20c.png",
  "/lovable-uploads/83d441a4-13af-461a-800b-3b483c153ed4.png",
];

interface BuildingsGridProps {
  buildings: any[];
  isLoading: boolean;
  issues: any[];
  activities: any[];
  onMarkAsSeen: (id: string) => void;
}

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
      {buildings?.map((building, index) => {
        const { floorCount, roomCount, workingFixtures, totalFixtures } = calculateBuildingStats(building);

        const buildingIssues =
          issues?.filter(
            (issue) =>
              issue.building_id === building.id && issue.photos?.length > 0
          ) || [];

        const buildingActivities =
          activities?.filter((activity) => {
            if (activity.metadata && typeof activity.metadata === "object") {
              const metadata = activity.metadata as Record<string, any>;
              return metadata.building_id === building.id;
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
            workingFixtures={workingFixtures}
            totalFixtures={totalFixtures}
            buildingIssues={buildingIssues}
            buildingActivities={buildingActivities}
            onMarkAsSeen={onMarkAsSeen}
          />
        );
      })}
    </div>
  );
}
