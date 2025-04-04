
import { format } from "date-fns";
import { Issue } from "../types/IssueTypes";
import { IssueBadges } from "./IssueBadges";
import { IssueStatusBadge } from "./IssueStatusBadge";
import { IssueMetadata } from "./IssueMetadata";

interface CardFrontProps {
  issue: Issue;
  onMarkAsSeen?: (id: string) => void;
  actions?: React.ReactNode;
}

export function CardFront({ issue, onMarkAsSeen, actions }: CardFrontProps) {
  const handleMarkAsSeen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMarkAsSeen && issue.id) {
      onMarkAsSeen(issue.id);
    }
  };

  return (
    <div className="absolute inset-0 backface-hidden border rounded-md overflow-hidden shadow-sm">
      <div className="flex flex-col h-full bg-card text-card-foreground">
        <div className="p-4 pb-2">
          <div className="flex justify-between mb-2">
            <IssueStatusBadge status={issue.status} />
            {issue.seen === false && (
              <span 
                className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 cursor-pointer"
                onClick={handleMarkAsSeen}
              >
                New
              </span>
            )}
          </div>
          <h3 className="font-bold text-lg line-clamp-2 mb-1">
            {issue.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-3 mb-2">
            {issue.description}
          </p>
          <IssueBadges issue={issue} />
        </div>

        <div className="mt-auto p-4 pt-2 border-t">
          <IssueMetadata issue={issue} />
          {actions && (
            <div className="flex justify-end mt-2">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
