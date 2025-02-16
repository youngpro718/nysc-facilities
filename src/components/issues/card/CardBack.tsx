
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Issue } from "../types/IssueTypes";
import { format } from "date-fns";
import { IssuePhotos } from "./IssuePhotos";

interface CardBackProps {
  issue: Issue;
}

export function CardBack({ issue }: CardBackProps) {
  return (
    <Card className="absolute w-full h-full backface-hidden rotate-y-180">
      <CardHeader className="flex-none">
        <CardTitle>Issue Details</CardTitle>
      </CardHeader>
      <ScrollArea className="h-[calc(100%-5rem)] px-6">
        <div className="space-y-4 pb-6">
          {issue.resolution_notes && (
            <div className="space-y-1">
              <p className="text-sm font-medium">Resolution Notes</p>
              <p className="text-sm text-muted-foreground break-words">
                {issue.resolution_notes}
              </p>
            </div>
          )}

          {issue.photos && issue.photos.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Photos</h4>
              <IssuePhotos photos={issue.photos} />
            </div>
          )}

          {issue.resolution_date && (
            <div className="mt-4 text-sm text-muted-foreground">
              Resolved on {format(new Date(issue.resolution_date), 'MMM d, yyyy')}
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}
