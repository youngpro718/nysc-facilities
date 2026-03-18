import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";
import { MapPin, User, MessageCircle, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { EnhancedIssue } from "@features/dashboard/hooks/useAdminIssuesData";

interface IssueTimelineViewProps {
  issues: EnhancedIssue[];
  onIssueUpdate: () => void;
  onIssueSelect?: (issueId: string) => void;
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "EEEE, MMMM d, yyyy");
}

function getStatusDot(status: string) {
  switch (status) {
    case 'open':
      return <span className="w-3 h-3 rounded-full bg-red-500 ring-2 ring-red-200 dark:ring-red-900 flex-shrink-0" />;
    case 'in_progress':
      return <span className="w-3 h-3 rounded-full bg-amber-500 ring-2 ring-amber-200 dark:ring-amber-900 flex-shrink-0" />;
    case 'resolved':
      return <span className="w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-900 flex-shrink-0" />;
    default:
      return <span className="w-3 h-3 rounded-full bg-muted-foreground/40 flex-shrink-0" />;
  }
}

function getPriorityBadgeVariant(priority: string): "destructive" | "secondary" | "outline" {
  switch (priority) {
    case 'high': return 'destructive';
    case 'medium': return 'secondary';
    default: return 'outline';
  }
}

function getPriorityIcon(priority: string) {
  if (priority === 'high') return <AlertTriangle className="h-3 w-3" />;
  if (priority === 'medium') return <Clock className="h-3 w-3" />;
  return <CheckCircle2 className="h-3 w-3" />;
}

export function IssueTimelineView({ issues, onIssueSelect }: IssueTimelineViewProps) {
  const groupedByDate = issues.reduce((acc, issue) => {
    const date = new Date(issue.created_at).toDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(issue);
    return acc;
  }, {} as Record<string, EnhancedIssue[]>);

  const sortedDates = Object.keys(groupedByDate).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  if (sortedDates.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No issues to display.
      </div>
    );
  }

  return (
    <div className="px-4 py-2 space-y-8">
      {sortedDates.map((date) => {
        const dayIssues = groupedByDate[date].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        return (
          <div key={date}>
            {/* Sticky date chip */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2 bg-muted px-3 py-1 rounded-full text-xs font-semibold text-muted-foreground tracking-wide uppercase">
                {formatDateLabel(date)}
                <span className="bg-background text-foreground rounded-full px-1.5 py-0.5 text-[10px] font-bold border">
                  {dayIssues.length}
                </span>
              </div>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Vertical rail */}
            <div className="relative pl-6">
              <div className="absolute left-[5px] top-0 bottom-0 w-px bg-border" />

              <div className="space-y-3">
                {dayIssues.map((issue) => (
                  <div key={issue.id} className="relative flex items-start gap-3 group">
                    {/* Status dot on the rail */}
                    <div className="absolute -left-[19px] top-3 z-10">
                      {getStatusDot(issue.status)}
                    </div>

                    {/* Issue row card */}
                    <div
                      className="flex-1 border rounded-lg px-4 py-3 bg-card hover:bg-muted/40 transition-colors cursor-pointer group-hover:border-primary/40"
                      onClick={() => onIssueSelect?.(issue.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {/* Badges row */}
                          <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                            <Badge
                              variant={getPriorityBadgeVariant(issue.priority)}
                              className="text-[10px] px-1.5 py-0 h-5 flex items-center gap-1"
                            >
                              {getPriorityIcon(issue.priority)}
                              {issue.priority.charAt(0).toUpperCase() + issue.priority.slice(1)}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1.5 py-0 h-5 ${
                                issue.status === 'open'
                                  ? 'border-red-300 text-red-700 dark:text-red-400'
                                  : issue.status === 'in_progress'
                                  ? 'border-amber-300 text-amber-700 dark:text-amber-400'
                                  : 'border-emerald-300 text-emerald-700 dark:text-emerald-400'
                              }`}
                            >
                              {issue.status.replace('_', ' ')}
                            </Badge>
                          </div>

                          {/* Title */}
                          <p className="font-semibold text-sm leading-snug truncate">
                            {issue.title}
                          </p>

                          {/* Meta row */}
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                            {issue.rooms && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {issue.rooms.room_number}{issue.rooms.name ? ` · ${issue.rooms.name}` : ''}
                              </span>
                            )}
                            {issue.reporter && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {issue.reporter.first_name} {issue.reporter.last_name}
                              </span>
                            )}
                            {issue.comments_count > 0 && (
                              <span className="flex items-center gap-1">
                                <MessageCircle className="h-3 w-3" />
                                {issue.comments_count}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Relative time */}
                        <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0 pt-0.5">
                          {formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}