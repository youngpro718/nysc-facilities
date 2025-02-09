
import { AlertTriangle, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { EditIssueDialog } from "../EditIssueDialog";
import { isAfter } from "date-fns";
import { IssueStatusBadge } from "./IssueStatusBadge";
import { IssueBadges } from "./IssueBadges";
import { IssueMetadata } from "./IssueMetadata";
import { type Issue } from "../types/IssueTypes";

interface CardFrontProps {
  issue: Issue;
  onDelete: (id: string) => Promise<void>;
  onUpdate: () => Promise<void>;
  onMarkAsSeen: (id: string) => Promise<void>;
  buildingName?: string;
  floorName?: string;
  roomName?: string;
}

export const CardFront = ({
  issue,
  onDelete,
  onUpdate,
  onMarkAsSeen,
  buildingName,
  floorName,
  roomName
}: CardFrontProps) => {
  const isOverdue = issue.due_date && isAfter(new Date(), new Date(issue.due_date));
  const timeRemaining = issue.sla_hours ? `${issue.sla_hours}h SLA` : 'No SLA set';

  return (
    <Card className="absolute w-full h-full backface-hidden p-4 space-y-4">
      <div className="absolute -top-2 -right-2 flex gap-2">
        {!issue.seen && (
          <div className="bg-blue-500 rounded-full p-1 animate-bounce shadow-lg">
            <Eye className="h-4 w-4 text-white" />
          </div>
        )}
        {isOverdue && (
          <div className="bg-red-500 rounded-full p-1 animate-pulse shadow-lg">
            <AlertTriangle className="h-4 w-4 text-white" />
          </div>
        )}
      </div>

      <div className="flex items-start justify-between">
        <div className="space-y-1 flex-1 min-w-0">
          <h3 className="font-semibold truncate">{issue.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{issue.description}</p>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <IssueStatusBadge status={issue.status} />
        <IssueBadges
          status={issue.status}
          priority={issue.priority}
          isOverdue={isOverdue}
          seen={issue.seen}
          onMarkAsSeen={() => onMarkAsSeen(issue.id)}
        />
      </div>

      <IssueMetadata
        timeRemaining={timeRemaining}
        dueDate={issue.due_date || undefined}
        isOverdue={isOverdue}
        buildingName={buildingName}
        floorName={floorName}
        roomName={roomName}
        assigned_to={issue.assigned_to}
        status_history={issue.status_history || undefined}
      />

      <div className="flex items-center gap-2 mt-auto">
        <EditIssueDialog issue={issue} onIssueUpdated={onUpdate} />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Issue</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this issue? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(issue.id)}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Card>
  );
};
