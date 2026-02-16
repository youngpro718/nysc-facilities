
import { useNavigate } from "react-router-dom";
import { Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { BuildingStats } from "./BuildingStats";
import { BuildingIssues } from "./BuildingIssues";
import { BuildingActivities } from "./BuildingActivities";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  const navigate = useNavigate();

  // Get the most recent unseen issue with photos
  const mostRecentIssue = buildingIssues
    .filter(issue => !issue.seen && issue.photos && issue.photos.length > 0)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

  const handleImageClick = () => {
    if (mostRecentIssue) {
      onMarkAsSeen(mostRecentIssue.id);
      navigate(`/operations?issue_id=${mostRecentIssue.id}`);
    }
  };

  return (
    <Card className="group overflow-hidden">
      <AspectRatio ratio={16 / 9}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div 
                className={`relative h-full w-full cursor-pointer ${mostRecentIssue ? 'group' : ''}`}
                onClick={handleImageClick}
              >
                <div className="relative h-full w-full transition-opacity duration-300">
                  <img
                    src={mostRecentIssue?.photos?.[0] || buildingImage}
                    alt={mostRecentIssue ? `Active issue in ${building.name}` : building.name}
                    className={`absolute inset-0 h-full w-full object-cover transition-all duration-300 group-hover:scale-105 ${
                      mostRecentIssue ? 'ring-2 ring-red-500/40' : ''
                    }`}
                  />
                </div>
                {mostRecentIssue && (
                  <>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Badge variant="destructive" className="text-sm ring-1 ring-destructive">
                        View Active Issue
                      </Badge>
                    </div>
                    <div className="absolute left-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <img
                        src={buildingImage}
                        alt="Default building view"
                        className="h-12 w-12 rounded-md object-cover border-2 border-white dark:border-slate-700"
                      />
                    </div>
                  </>
                )}
                {buildingIssues.length > 0 && (
                  <div className="absolute right-2 top-2">
                    <Badge 
                      variant="destructive" 
                      className="text-xs cursor-pointer hover:scale-105 transition-transform"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (building?.id) {
                          navigate(`/operations?building=${building.id}&filter=active`);
                        }
                      }}
                    >
                      {buildingIssues.length} Active Issues
                    </Badge>
                  </div>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-black text-white">
              {mostRecentIssue 
                ? "Click to view the latest issue reported for this building"
                : "No urgent issues reported for this building"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </AspectRatio>
      <CardHeader className="space-y-1.5 p-4">
        <Badge
          variant={building?.status === "active" ? "default" : "destructive"}
          className="w-fit animate-in fade-in-50 text-xs cursor-pointer hover:scale-105 transition-transform"
          onClick={() => building?.id && navigate(`/spaces?building=${building.id}`)}
        >
          {building?.status === "active" ? "Operational" : "Under Maintenance"}
        </Badge>
        <div className="flex items-center gap-1.5">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <h3 
            className="text-lg font-semibold leading-none cursor-pointer hover:text-primary transition-colors"
            onClick={() => building?.id && navigate(`/spaces?building=${building.id}`)}
          >
            {building?.name}
          </h3>
        </div>
        <p className="text-xs text-muted-foreground">{building?.address}</p>
      </CardHeader>
      <CardContent className="space-y-4 p-4 pt-0">
        <BuildingStats
          floorCount={floorCount}
          roomCount={roomCount}
          issues={buildingIssues.length}
          workingFixtures={workingFixtures}
          totalFixtures={totalFixtures}
          buildingId={building.id}
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
