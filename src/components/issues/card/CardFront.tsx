
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Issue } from "../types/IssueTypes";
import { IssueBadges } from "./IssueBadges";
import { IssueMetadata } from "./IssueMetadata";
import { format } from "date-fns";
import { getPriorityGradient } from "./utils/cardStyles";

interface CardFrontProps {
  issue: Issue;
  onMarkAsSeen?: (id: string) => void;
}

export function CardFront({ issue, onMarkAsSeen }: CardFrontProps) {
  const isOverdue = issue.due_date ? new Date(issue.due_date) < new Date() : false;
  const timeRemaining = issue.due_date 
    ? `Due in ${Math.ceil((new Date(issue.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days`
    : 'No due date set';

  return (
    <Card 
      className="absolute w-full h-full backface-hidden overflow-hidden transition-all duration-300"
      style={{
        background: getPriorityGradient(issue.priority)
      }}
    >
      <div className="absolute inset-0 bg-card/90 backdrop-blur-[2px]">
        <CardHeader className="p-4">
          <CardTitle className="flex items-center justify-between gap-4 text-lg">
            <div className="flex items-center gap-2">
              <span className="truncate font-medium">{issue.title}</span>
              {issue.photos && issue.photos.length > 0 && (
                <Badge variant="secondary" className="shrink-0">
                  {issue.photos.length} photos
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-4">
          <IssueBadges
            status={issue.status}
            priority={issue.priority}
            isOverdue={isOverdue}
            seen={issue.seen}
            onMarkAsSeen={() => onMarkAsSeen?.(issue.id)}
          />
          
          <div className="prose prose-sm max-w-none">
            <p className="text-muted-foreground line-clamp-2 text-sm">{issue.description}</p>
          </div>

          <IssueMetadata
            timeRemaining={timeRemaining}
            dueDate={issue.due_date}
            isOverdue={isOverdue}
            buildingName={issue.buildings?.name}
            floorName={issue.floors?.name}
            roomName={issue.rooms?.name}
            assigned_to={issue.assigned_to || 'Unassigned'}
          />

          <div className="absolute bottom-4 left-4 text-xs text-muted-foreground/80">
            Created {format(new Date(issue.created_at), 'MMM d, yyyy')}
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
