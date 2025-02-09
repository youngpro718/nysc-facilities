import { Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { BuildingStats } from "./BuildingStats";
import { BuildingIssues } from "./BuildingIssues";
import { BuildingActivities } from "./BuildingActivities";

interface BuildingCardProps {
  building: any;
  buildingImage: string;
  floorCount: number;
  roomCount: number;
  workingFixtures: number;
  totalFixtures: number;
  buildingIssues: any[];
  buildingActivities: any[];
  onMarkAsSeen: (issueId: string) => void;
}

export const BuildingCard = ({
  building,
  buildingImage,
  floorCount,
  roomCount,
  workingFixtures,
  totalFixtures,
  buildingIssues,
  buildingActivities,
  onMarkAsSeen,
}: BuildingCardProps) => {
  const scheduledTasks = buildingIssues.length;

  return (
    <Card className="group overflow-hidden">
      <AspectRatio ratio={16 / 9}>
        <div className="relative h-full w-full">
          <img
            src={buildingImage}
            alt={building.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {buildingIssues.length > 0 && (
            <div className="absolute right-2 top-2">
              <Badge variant="destructive" className="animate-pulse text-xs">
                {buildingIssues.length} Active Issues
              </Badge>
            </div>
          )}
        </div>
      </AspectRatio>
      <CardHeader className="space-y-1.5 p-4">
        <Badge
          variant={building.status === "active" ? "default" : "destructive"}
          className="w-fit animate-in fade-in-50 text-xs"
        >
          {building.status === "active" ? "Operational" : "Under Maintenance"}
        </Badge>
        <div className="flex items-center gap-1.5">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold leading-none">{building.name}</h3>
        </div>
        <p className="text-xs text-muted-foreground">{building.address}</p>
      </CardHeader>
      <CardContent className="space-y-4 p-4 pt-0">
        <BuildingStats
          floorCount={floorCount}
          roomCount={roomCount}
          scheduledTasks={scheduledTasks}
          workingFixtures={workingFixtures}
          totalFixtures={totalFixtures}
        />

        {buildingIssues.length > 0 && (
          <BuildingIssues issues={buildingIssues} onMarkAsSeen={onMarkAsSeen} />
        )}

        {buildingActivities.length > 0 && (
          <BuildingActivities activities={buildingActivities} />
        )}
      </CardContent>
    </Card>
  );
};