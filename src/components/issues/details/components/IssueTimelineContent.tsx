
import { TimelineEvent } from "../types/TimelineTypes";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Clock, CheckCircle2, MessageSquare, AlertCircle, Loader2 } from "lucide-react";

interface IssueTimelineContentProps {
  timeline?: TimelineEvent[];
  timelineLoading: boolean;
  issueCreatedAt: string;
}

export const IssueTimelineContent = ({ 
  timeline, 
  timelineLoading,
  issueCreatedAt 
}: IssueTimelineContentProps) => {
  const getTimelineIcon = (actionType: string) => {
    switch (actionType) {
      case 'status_change':
        return <Clock className="h-4 w-4" />;
      case 'resolution':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'comment':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getTimelineContent = (event: TimelineEvent) => {
    switch (event.action_type) {
      case 'status_change':
        return (
          <>
            <p className="font-medium">Status Changed</p>
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline">{event.previous_status}</Badge>
              →
              <Badge>{event.new_status}</Badge>
            </div>
          </>
        );
      case 'resolution':
        return (
          <>
            <p className="font-medium">Issue Resolved</p>
            {event.action_details && (
              <p className="text-sm text-muted-foreground">
                Resolution type: {event.action_details.resolution_type}
                {event.action_details.resolution_notes && (
                  <>
                    <br />
                    {event.action_details.resolution_notes}
                  </>
                )}
              </p>
            )}
          </>
        );
      default:
        return <p className="font-medium">{event.action_type}</p>;
    }
  };

  if (timelineLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="border-l-2 border-muted pl-4 space-y-4">
        {/* Creation event always shown first */}
        <div className="relative">
          <div className="absolute -left-[21px] rounded-full w-4 h-4 bg-background border-2 border-primary"></div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              {format(new Date(issueCreatedAt), 'MMM d, yyyy HH:mm')}
            </p>
            <p className="font-medium">Issue Created</p>
          </div>
        </div>

        {/* Timeline events */}
        {timeline?.map((event) => (
          <div key={event.id} className="relative">
            <div className="absolute -left-[21px] rounded-full w-4 h-4 bg-background border-2 border-primary flex items-center justify-center">
              {getTimelineIcon(event.action_type)}
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                {format(new Date(event.performed_at), 'MMM d, yyyy HH:mm')}
              </p>
              {getTimelineContent(event)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
