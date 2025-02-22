
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Issue } from "../types/IssueTypes";
import { IssueBadges } from "./IssueBadges";
import { IssueMetadata } from "./IssueMetadata";
import { format } from "date-fns";

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
    <Card className="absolute w-full h-full backface-hidden">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="truncate">{issue.title}</span>
            {issue.photos && issue.photos.length > 0 && (
              <Badge variant="secondary" className="shrink-0">
                {issue.photos.length} photos
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <IssueBadges
            status={issue.status}
            priority={issue.priority}
            isOverdue={isOverdue}
            seen={issue.seen}
            onMarkAsSeen={() => onMarkAsSeen?.(issue.id)}
          />
          
          <IssueMetadata
            timeRemaining={timeRemaining}
            dueDate={issue.due_date}
            isOverdue={isOverdue}
            buildingName={issue.buildings?.name}
            floorName={issue.floors?.name}
            roomName={issue.rooms?.name}
            assigned_to={issue.assigned_to || 'Unassigned'}
          />

          <div className="prose prose-sm max-w-none">
            <p className="text-muted-foreground line-clamp-3">{issue.description}</p>
          </div>

          <div className="absolute bottom-16 left-6 text-sm text-muted-foreground">
            Created {format(new Date(issue.created_at), 'MMM d, yyyy')}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

