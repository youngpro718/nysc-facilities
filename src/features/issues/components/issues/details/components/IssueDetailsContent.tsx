
import { Issue } from "../../types/IssueTypes";
import { IssueBadges } from "../../card/IssueBadges";
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
    <div className="space-y-5 animate-in fade-in-50">
      {/* Priority / Overdue / Seen badges + Type badge — compact row */}
      <div className="flex items-center gap-2 flex-wrap">
        <IssueBadges
          status={issue.status}
          priority={issue.priority}
          isOverdue={isOverdue}
          seen={issue.seen}
          onMarkAsSeen={onMarkAsSeen}
        />
        <IssueTypeBadge issueType={issue.issue_type} />
      </div>

      {/* Location & timing — compact strip */}
      <div className="flex items-center gap-4 flex-wrap text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Building className="h-3.5 w-3.5" />
          {issue.buildings?.name || 'No building'}
        </span>

        {(issue.floors?.name || issue.rooms?.name) && (
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            {[issue.floors?.name, issue.rooms?.name].filter(Boolean).join(' › ')}
          </span>
        )}

        <span className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          {timeRemaining}
        </span>

        {issue.due_date && (
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Due: {new Date(issue.due_date).toLocaleDateString()}
            {isOverdue && (
              <Badge variant="destructive" className="gap-1 ml-1 text-xs py-0">
                <AlertTriangle className="h-3 w-3" />
                Overdue
              </Badge>
            )}
          </span>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-foreground">Description</h3>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
          {issue.description || 'No description provided.'}
        </p>
      </div>

      {/* Resolution Notes */}
      {issue.resolution_notes && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-foreground">Resolution Notes</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {issue.resolution_notes}
          </p>
        </div>
      )}

      {/* Linked Tasks */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium text-foreground">Linked Tasks</h3>
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
  );
};
