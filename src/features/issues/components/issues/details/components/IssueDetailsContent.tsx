
import { Issue } from "../../types/IssueTypes";
import { IssueBadges } from "../../card/IssueBadges";
import { IssueMetadata } from "../../card/IssueMetadata";
import { Badge } from "@/components/ui/badge";
import { IssueTypeBadge } from "../../card/IssueTypeBadge";
import { Building, MapPin, Calendar, Clock, AlertTriangle } from "lucide-react";
import { LinkedTaskSummary } from "../hooks/useIssueData";
import { TASK_PRIORITY_COLORS, TASK_STATUS_COLORS, TASK_STATUS_LABELS, TASK_TYPE_LABELS } from "@features/tasks/types/staffTasks";

interface IssueDetailsContentProps {
  issue: Issue;
  isOverdue: boolean;
  timeRemaining: string;
  onMarkAsSeen: () => void;
  linkedTasks?: LinkedTaskSummary[];
  linkedTasksLoading?: boolean;
}

export const IssueDetailsContent = ({
  issue,
  isOverdue,
  timeRemaining,
  onMarkAsSeen,
  linkedTasks = [],
  linkedTasksLoading = false
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
        <IssueTypeBadge issueType={issue.issue_type} />
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

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-medium">Linked Tasks</h3>
              <Badge variant="outline" className="text-xs">
                {linkedTasks.length}
              </Badge>
            </div>

            {linkedTasksLoading ? (
              <p className="text-sm text-muted-foreground">Loading linked tasks...</p>
            ) : linkedTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No tasks have been linked to this issue yet.
              </p>
            ) : (
              <div className="space-y-2">
                {linkedTasks.map((task) => (
                  <div key={task.id} className="rounded-lg border bg-muted/20 p-3 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{task.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {TASK_TYPE_LABELS[task.task_type as keyof typeof TASK_TYPE_LABELS] || task.task_type}
                        </p>
                      </div>
                      <Badge className={`text-white ${TASK_STATUS_COLORS[task.status as keyof typeof TASK_STATUS_COLORS] || 'bg-gray-500'}`}>
                        {TASK_STATUS_LABELS[task.status as keyof typeof TASK_STATUS_LABELS] || task.status}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                      <Badge variant="outline" className={`text-xs border-0 text-white ${TASK_PRIORITY_COLORS[task.priority as keyof typeof TASK_PRIORITY_COLORS] || 'bg-gray-500'}`}>
                        {task.priority}
                      </Badge>
                      <span>
                        Created {new Date(task.created_at).toLocaleDateString()}
                      </span>
                      {task.due_date && (
                        <span>Due {new Date(task.due_date).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
