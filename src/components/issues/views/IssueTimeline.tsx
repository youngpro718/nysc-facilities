import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { type Issue } from "../types/IssueTypes";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface IssueTimelineProps {
  issues: Issue[];
}

export const IssueTimeline = ({ issues }: IssueTimelineProps) => {
  const sortedIssues = [...issues].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-500';
      case 'in_progress':
        return 'bg-blue-500';
      default:
        return 'bg-yellow-500';
    }
  };

  return (
    <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:w-0.5 before:bg-muted">
      {sortedIssues.map((issue, index) => (
        <div key={issue.id} className="relative flex gap-6 items-start animate-in slide-in-from-left-5 duration-300" style={{ animationDelay: `${index * 100}ms` }}>
          <div className="absolute left-0 flex items-center justify-center w-10 h-10 rounded-full bg-card border shadow-lg">
            <div className={cn("w-3 h-3 rounded-full", getStatusColor(issue.status))} />
          </div>
          
          <Card className="flex-1 ml-12 p-4 space-y-2 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <h4 className="font-medium flex items-center gap-2">
                {getStatusIcon(issue.status)}
                {issue.title}
              </h4>
              <time className="text-sm text-muted-foreground">
                {format(new Date(issue.created_at), 'MMM d, yyyy')}
              </time>
            </div>
            <p className="text-sm text-muted-foreground">{issue.description}</p>
            <div className="flex gap-2 text-sm">
              <span className="text-muted-foreground">Status:</span>
              <span className="capitalize">{issue.status.replace('_', ' ')}</span>
            </div>
            {issue.buildingName && (
              <div className="text-sm text-muted-foreground">
                Location: {[issue.buildingName, issue.floorName, issue.roomName].filter(Boolean).join(' > ')}
              </div>
            )}
          </Card>
        </div>
      ))}
    </div>
  );
};
