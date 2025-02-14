
import { Issue } from "../../types/IssueTypes";
import { IssueBadges } from "../../card/IssueBadges";
import { IssueMetadata } from "../../card/IssueMetadata";

interface IssueDetailsContentProps {
  issue: Issue;
  isOverdue: boolean;
  timeRemaining: string;
  onMarkAsSeen: () => void;
}

export function IssueDetailsContent({ 
  issue, 
  isOverdue, 
  timeRemaining, 
  onMarkAsSeen 
}: IssueDetailsContentProps) {
  return (
    <div className="space-y-4">
      <IssueBadges
        status={issue.status}
        priority={issue.priority}
        isOverdue={isOverdue}
        seen={issue.seen}
        onMarkAsSeen={onMarkAsSeen}
      />
      
      <IssueMetadata
        timeRemaining={timeRemaining}
        dueDate={issue.due_date}
        isOverdue={isOverdue}
        buildingName={issue.buildings?.name}
        floorName={issue.floors?.name}
        roomName={issue.rooms?.name}
        assigned_to={issue.assignee_id || 'Unassigned'}
      />

      <div className="prose max-w-none">
        <h3 className="text-lg font-semibold">Description</h3>
        <p>{issue.description}</p>
      </div>

      {issue.resolution_notes && (
        <div className="prose max-w-none">
          <h3 className="text-lg font-semibold">Resolution Notes</h3>
          <p>{issue.resolution_notes}</p>
        </div>
      )}
    </div>
  );
}
