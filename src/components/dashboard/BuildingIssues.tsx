import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface BuildingIssuesProps {
  issues: any[];
  onMarkAsSeen: (issueId: string) => void;
}

export const BuildingIssues = ({ issues, onMarkAsSeen }: BuildingIssuesProps) => {
  if (issues.length === 0) return null;

  return (
    <div className="space-y-4">
      <h4 className="flex items-center gap-2 font-medium">
        <AlertCircle className="h-4 w-4 text-yellow-500" />
        Recent Issues
      </h4>
      <div className="grid gap-4">
        {issues.map((issue) => (
          <div
            key={issue.id}
            className="group relative overflow-hidden rounded-lg border bg-card p-4 transition-all hover:bg-accent"
          >
            <div className="mb-4 flex justify-between">
              <div>
                <h5 className="font-medium">{issue.title}</h5>
                <p className="text-sm text-muted-foreground">{issue.description}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Created: {format(new Date(issue.created_at), "MMM d, yyyy")}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onMarkAsSeen(issue.id)}
                className="shrink-0 hover:bg-yellow-50 hover:text-yellow-600 hover:border-yellow-200"
              >
                Mark as seen
              </Button>
            </div>
            {issue.photos && issue.photos.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {issue.photos.map((photo: string, photoIndex: number) => (
                  <div key={photoIndex} className="relative aspect-video overflow-hidden rounded-md">
                    <img
                      src={photo}
                      alt={`Issue photo ${photoIndex + 1}`}
                      className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};