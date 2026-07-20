import { BuildingCard } from "./BuildingCard";
import { BuildingCardSkeleton } from "./BuildingCardSkeleton";
import { logger } from "@/lib/logger";
import { calculateBuildingStats } from "@/utils/dashboardUtils";
import { useAuth } from "@features/auth/hooks/useAuth";
import { useDismissedIssuePhotos } from "@features/dashboard/hooks/useDismissedIssuePhotos";
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
  priority?: string;
  issue_type?: string;
  rooms?: {
    room_number?: string;
    name?: string;
  } | null;
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
  "/buildings/100-centre-street.webp",
  "/buildings/111-centre-street.webp",
];

export function BuildingsGrid({
  buildings,
  isLoading,
  issues,
  activities,
  onMarkAsSeen,
}: BuildingsGridProps) {
  const { user } = useAuth();
  const { dismissedIds, dismissPhoto } = useDismissedIssuePhotos(user?.id);

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

        const fallbackImage = buildingImages[index % buildingImages.length];
        let dynamicImage = fallbackImage;

        // All open issues with a photo, newest first. The hero shows the
        // newest one THIS admin hasn't dismissed; everything else (including
        // dismissed ones) surfaces as small thumbnails — dismissing never
        // hides a photo entirely, it just demotes it.
        const issuesWithPhotos = buildingIssues
          .filter(issue => issue.photos && issue.photos.length > 0)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        const latestPhotoIssue = issuesWithPhotos.find(issue => !dismissedIds.has(issue.id));
        const otherPhotoIssues = issuesWithPhotos.filter(issue => issue.id !== latestPhotoIssue?.id);

        if (latestPhotoIssue?.photos?.[0]) {
          dynamicImage = latestPhotoIssue.photos[0];
        }

        return (
          <BuildingCard
            key={building.id}
            building={building}
            buildingImage={dynamicImage}
            fallbackImage={fallbackImage}
            floorCount={floorCount}
            roomCount={roomCount}
            workingFixtures={effectiveWorking}
            totalFixtures={effectiveTotal}
            buildingIssues={buildingIssues}
            latestPhotoIssue={latestPhotoIssue}
            otherPhotoIssues={otherPhotoIssues}
            onDismissPhoto={dismissPhoto}
            buildingActivities={buildingActivities}
            _onMarkAsSeen={onMarkAsSeen}
          />
        );
      })}
    </div>
  );
}
