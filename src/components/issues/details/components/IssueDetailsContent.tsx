
import { Issue } from "../../types/IssueTypes";
import { IssueBadges } from "../../card/IssueBadges";
import { IssueMetadata } from "../../card/IssueMetadata";
import { Badge } from "@/components/ui/badge";
import { Building, MapPin, Calendar, Clock, AlertTriangle } from "lucide-react";

interface IssueDetailsContentProps {
  issue: Issue;
  isOverdue: boolean;
  timeRemaining: string;
  onMarkAsSeen: () => void;
}

export const IssueDetailsContent = ({
  issue,
  isOverdue,
  timeRemaining,
  onMarkAsSeen
}: IssueDetailsContentProps) => {
  return (
    <div className="space-y-6 animate-in fade-in-50">
      <div className="flex items-start gap-4 flex-wrap">
        <IssueBadges
          status={issue.status}
          priority={issue.priority}
          isOverdue={isOverdue}
          seen={issue.seen}
          onMarkAsSeen={onMarkAsSeen}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Building className="h-4 w-4" />
            <span>{issue.buildings?.name || 'No building assigned'}</span>
          </div>
          
          {(issue.floors?.name || issue.rooms?.name) && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>
                {[issue.floors?.name, issue.rooms?.name]
                  .filter(Boolean)
                  .join(' > ')}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{timeRemaining}</span>
          </div>

          {issue.due_date && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Due: {new Date(issue.due_date).toLocaleDateString()}</span>
              {isOverdue && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Overdue
                </Badge>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="font-medium">Description</h3>
          <p className="text-muted-foreground whitespace-pre-wrap">
            {issue.description}
          </p>

          {issue.resolution_notes && (
            <>
              <h3 className="font-medium pt-4">Resolution Notes</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {issue.resolution_notes}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
