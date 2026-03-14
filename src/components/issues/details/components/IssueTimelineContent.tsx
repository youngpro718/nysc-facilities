
import { TimelineEvent } from "../types/TimelineTypes";
import { Badge } from "@/components/ui/badge";
import { format, formatDistanceToNow } from "date-fns";
import { Clock, CheckCircle2, MessageSquare, AlertCircle, Loader2, Plus, ArrowRight } from "lucide-react";

interface IssueTimelineContentProps {
  timeline?: TimelineEvent[];
  timelineLoading: boolean;
  issueCreatedAt: string;
}

function getEventDotClass(actionType: string): string {
  switch (actionType) {
    case 'status_change': return 'bg-amber-500 ring-2 ring-amber-200 dark:ring-amber-900';
    case 'resolution': return 'bg-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-900';
    case 'comment': return 'bg-blue-500 ring-2 ring-blue-200 dark:ring-blue-900';
    default: return 'bg-slate-400 ring-2 ring-slate-200 dark:ring-slate-700';
  }
}

function getEventIcon(actionType: string) {
  switch (actionType) {
    case 'status_change': return <Clock className="h-3.5 w-3.5" />;
    case 'resolution': return <CheckCircle2 className="h-3.5 w-3.5" />;
    case 'comment': return <MessageSquare className="h-3.5 w-3.5" />;
    default: return <AlertCircle className="h-3.5 w-3.5" />;
  }
}

function getStatusBadgeClass(status: string): string {
  if (status === 'open') return 'border-red-300 text-red-700 dark:text-red-400';
  if (status === 'in_progress') return 'border-amber-300 text-amber-700 dark:text-amber-400';
  if (status === 'resolved') return 'border-emerald-300 text-emerald-700 dark:text-emerald-400';
  return '';
}

function getEventContent(event: TimelineEvent) {
  switch (event.action_type) {
    case 'status_change':
      return (
        <div className="space-y-1">
          <p className="font-medium text-sm">Status Changed</p>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant="outline" className={`text-xs ${getStatusBadgeClass(event.previous_status || '')}`}>
              {event.previous_status?.replace('_', ' ') || '—'}
            </Badge>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <Badge variant="outline" className={`text-xs ${getStatusBadgeClass(event.new_status || '')}`}>
              {event.new_status?.replace('_', ' ') || '—'}
            </Badge>
          </div>
        </div>
      );
    case 'resolution':
      return (
        <div className="space-y-1">
          <p className="font-medium text-sm text-emerald-700 dark:text-emerald-400">Issue Resolved</p>
          {event.action_details && (
            <p className="text-xs text-muted-foreground">
              {event.action_details.resolution_type && (
                <span className="capitalize">{event.action_details.resolution_type.replace(/_/g, ' ')}</span>
              )}
              {event.action_details.resolution_notes && (
                <span> · {event.action_details.resolution_notes}</span>
              )}
            </p>
          )}
        </div>
      );
    case 'comment':
      return <p className="font-medium text-sm">Comment Added</p>;
    default:
      return <p className="font-medium text-sm capitalize">{event.action_type.replace(/_/g, ' ')}</p>;
  }
}

export const IssueTimelineContent = ({ 
  timeline, 
  timelineLoading,
  issueCreatedAt 
}: IssueTimelineContentProps) => {
  if (timelineLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const allEvents = [
    { id: '__created__', type: 'created' as const, timestamp: issueCreatedAt },
    ...(timeline || []).map(e => ({ id: e.id, type: 'event' as const, event: e, timestamp: e.performed_at })),
  ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return (
    <div className="relative pl-6 space-y-5 py-2">
      {/* Vertical rail */}
      <div className="absolute left-[9px] top-0 bottom-0 w-px bg-border" />

      {allEvents.map((entry) => {
        if (entry.type === 'created') {
          return (
            <div key="__created__" className="relative flex items-start gap-3">
              <div className="absolute -left-[15px] flex h-5 w-5 items-center justify-center rounded-full bg-primary ring-2 ring-background z-10">
                <Plus className="h-3 w-3 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-sm font-semibold">Issue Created</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {format(new Date(issueCreatedAt), 'MMM d, yyyy')} at {format(new Date(issueCreatedAt), 'HH:mm')}
                  {' · '}
                  <span className="italic">{formatDistanceToNow(new Date(issueCreatedAt), { addSuffix: true })}</span>
                </p>
              </div>
            </div>
          );
        }

        const e = entry.event!;
        return (
          <div key={e.id} className="relative flex items-start gap-3">
            <div className={`absolute -left-[15px] flex h-5 w-5 items-center justify-center rounded-full z-10 text-white ${getEventDotClass(e.action_type)}`}>
              {getEventIcon(e.action_type)}
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              {getEventContent(e)}
              <p className="text-xs text-muted-foreground mt-1">
                {format(new Date(e.performed_at), 'MMM d, yyyy')} at {format(new Date(e.performed_at), 'HH:mm')}
                {' · '}
                <span className="italic">{formatDistanceToNow(new Date(e.performed_at), { addSuffix: true })}</span>
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
