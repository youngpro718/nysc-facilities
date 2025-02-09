
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { type Issue } from "../types/IssueTypes";
import { IssuePhotos } from "./IssuePhotos";

interface CardBackProps {
  issue: Issue;
}

export const CardBack = ({ issue }: CardBackProps) => {
  return (
    <Card className="absolute w-full h-full backface-hidden rotate-y-180 p-4">
      <ScrollArea className="h-full px-1">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {issue.description}
            </p>
          </div>

          {issue.photos && issue.photos.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Photos</h3>
              <IssuePhotos photos={issue.photos} />
            </div>
          )}

          {issue.status_history && issue.status_history.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Status History</h3>
              <div className="space-y-2">
                {issue.status_history.map((history, index) => (
                  <div key={index} className="text-sm p-2 bg-muted rounded-lg">
                    <p className="font-medium">
                      {history.previous_status} → {history.status}
                    </p>
                    <p className="text-muted-foreground">
                      {format(new Date(history.changed_at), 'PPp')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="font-semibold mb-2">Details</h3>
            <div className="space-y-1 text-sm">
              <p>
                <span className="text-muted-foreground">Type:</span> {issue.type}
              </p>
              <p>
                <span className="text-muted-foreground">Priority:</span> {issue.priority}
              </p>
              <p>
                <span className="text-muted-foreground">Assigned to:</span> {issue.assigned_to}
              </p>
              <p>
                <span className="text-muted-foreground">Created:</span>{' '}
                {format(new Date(issue.created_at), 'PPp')}
              </p>
              {issue.due_date && (
                <p>
                  <span className="text-muted-foreground">Due:</span>{' '}
                  {format(new Date(issue.due_date), 'PPp')}
                </p>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    </Card>
  );
};
