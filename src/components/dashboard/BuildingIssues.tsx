import { AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";

interface Issue {
  id: string;
  title: string;
  description: string;
  created_at: string;
  seen: boolean;
  photos?: string[];
}

interface BuildingIssuesProps {
  issues: Issue[];
  onMarkAsSeen: (issueId: string) => void;
}

export const BuildingIssues = ({ issues, onMarkAsSeen }: BuildingIssuesProps) => {
  const navigate = useNavigate();
  if (issues.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="flex items-center gap-2 font-medium">
          <AlertCircle className="h-4 w-4 text-red-500" />
          Active Issues
        </h4>
        <Badge variant="destructive" className="text-xs">
          {issues.length} {issues.length === 1 ? 'Issue' : 'Issues'}
        </Badge>
      </div>
      <ScrollArea className="h-[200px] pr-4">
        <div className="space-y-2">
          {issues.map((issue) => (
            <div
              key={issue.id}
              className="group relative rounded-lg border bg-card p-3 transition-colors hover:bg-accent cursor-pointer"
              onClick={() => {
                if (!issue.seen) onMarkAsSeen(issue.id);
                navigate(`/operations?issue_id=${issue.id}`);
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{issue.title}</p>
                    {!issue.seen && (
                      <Badge variant="default" className="text-[10px]">New</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {issue.description}
                  </p>
                  {issue.photos && issue.photos.length > 0 && (
                    <div className="flex items-center gap-1">
                      <div className="flex -space-x-2">
                        {issue.photos.slice(0, 3).map((photo, index) => (
                          <img
                            key={index}
                            src={photo}
                            alt={`Issue photo ${index + 1}`}
                            className="h-6 w-6 rounded-full border-2 border-background object-cover"
                          />
                        ))}
                      </div>
                      {issue.photos.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{issue.photos.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {format(new Date(issue.created_at), "MMM d, h:mm a")}
                </span>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}; 