
import { format } from "date-fns";
import { type Issue } from "../types/IssueTypes";
import { getStatusIcon, getPriorityClass } from "./utils";

interface IssueMobileCardProps {
  issue: Issue;
}

export const IssueMobileCard = ({ issue }: IssueMobileCardProps) => {
  return (
    <div className="bg-card rounded-lg p-4 space-y-3 border border-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getStatusIcon(issue.status)}
          <span className="font-medium capitalize">{issue.status.replace('_', ' ')}</span>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs ${getPriorityClass(issue.priority)}`}>
          {issue.priority}
        </span>
      </div>
      
      <div>
        <h3 className="font-semibold">{issue.title}</h3>
        <p className="text-sm text-muted-foreground">{issue.type}</p>
      </div>

      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Location:</span>
          <span>{[issue.buildingName, issue.floorName, issue.roomName]
            .filter(Boolean)
            .join(' > ')}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Assigned to:</span>
          <span>{issue.assigned_to}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Due date:</span>
          <span>{issue.due_date ? format(new Date(issue.due_date), 'MMM d, yyyy') : '-'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Created:</span>
          <span>{format(new Date(issue.created_at), 'MMM d, yyyy')}</span>
        </div>
      </div>
    </div>
  );
};
