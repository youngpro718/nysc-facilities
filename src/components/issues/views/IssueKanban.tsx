
import { Card } from "@/components/ui/card";
import { type Issue } from "../types/IssueTypes";
import { IssueCard } from "../IssueCard";
import { Clock, CheckCircle2, AlertCircle } from "lucide-react";

interface IssueKanbanProps {
  issues: Issue[];
  onDelete: (id: string) => Promise<void>;
  onUpdate: () => Promise<void>;
  onMarkAsSeen: (id: string) => Promise<void>;
}

export const IssueKanban = ({ 
  issues,
  onDelete,
  onUpdate,
  onMarkAsSeen
}: IssueKanbanProps) => {
  const columns = {
    open: {
      title: "Open",
      icon: <AlertCircle className="h-4 w-4 text-yellow-500" />,
      issues: issues.filter(issue => issue.status === "open")
    },
    in_progress: {
      title: "In Progress",
      icon: <Clock className="h-4 w-4 text-blue-500" />,
      issues: issues.filter(issue => issue.status === "in_progress")
    },
    resolved: {
      title: "Resolved",
      icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
      issues: issues.filter(issue => issue.status === "resolved")
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-2">
      {Object.entries(columns).map(([status, { title, icon, issues: statusIssues }]) => (
        <div key={status} className="space-y-4">
          <Card className="p-4 bg-muted/50 border-t-4 border-t-primary">
            <h3 className="font-semibold capitalize flex items-center gap-2">
              {icon}
              <span>{title}</span>
              <span className="ml-auto text-sm text-muted-foreground bg-background/50 px-2 py-0.5 rounded-full">
                {statusIssues.length}
              </span>
            </h3>
          </Card>
          <div className="space-y-4 min-h-[200px]">
            {statusIssues.map(issue => (
              <div key={issue.id} className="group transition-all duration-200 hover:scale-[1.02]">
                <IssueCard
                  issue={issue}
                  buildingName={issue.buildingName}
                  floorName={issue.floorName}
                  roomName={issue.roomName}
                  onDelete={onDelete}
                  onUpdate={onUpdate}
                  onMarkAsSeen={onMarkAsSeen}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
