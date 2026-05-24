import { useMemo, useState } from "react";
import { formatDistanceToNowStrict, differenceInDays } from "date-fns";
import { ChevronDown, MapPin, MessageCircle, Camera, Hourglass } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { EnhancedIssue } from "@features/dashboard/hooks/useAdminIssuesData";

interface IssuesSidebarListProps {
  issues: EnhancedIssue[];
  selectedIssueId?: string | null;
  onSelect: (id: string) => void;
  isLoading?: boolean;
}

const STATUS_DOT: Record<string, string> = {
  open: "bg-status-critical",
  in_progress: "bg-status-warning",
  resolved: "bg-status-operational",
};

const STATUS_LEFT_BORDER: Record<string, string> = {
  open: "border-l-status-critical",
  in_progress: "border-l-status-warning",
  resolved: "border-l-status-operational",
};

const PRIORITY_DOT: Record<string, string> = {
  high: "bg-status-critical",
  medium: "bg-status-warning",
  low: "bg-status-neutral",
};

const STATUS_ORDER = ["open", "in_progress", "resolved"];
const STATUS_LABEL: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
};

export function IssuesSidebarList({
  issues,
  selectedIssueId,
  onSelect,
  isLoading,
}: IssuesSidebarListProps) {
  const grouped = useMemo(() => {
    const map = new Map<string, EnhancedIssue[]>();
    for (const i of issues) {
      const s = i.status || "open";
      const list = map.get(s) || [];
      list.push(i);
      map.set(s, list);
    }
    for (const [, list] of map) {
      list.sort((a, b) => {
        const pOrder = { high: 0, medium: 1, low: 2 } as Record<string, number>;
        const pd = (pOrder[a.priority] ?? 9) - (pOrder[b.priority] ?? 9);
        if (pd !== 0) return pd;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    }
    return Array.from(map.entries()).sort(
      ([a], [b]) => STATUS_ORDER.indexOf(a) - STATUS_ORDER.indexOf(b)
    );
  }, [issues]);

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    resolved: true,
  });

  if (isLoading) {
    return (
      <div className="p-3 space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <div className="p-6 text-sm text-muted-foreground text-center">
        No issues match the current filters.
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-3">
        {grouped.map(([status, list]) => {
          const isCollapsed = collapsed[status];
          return (
            <div key={status}>
              <button
                onClick={() =>
                  setCollapsed((c) => ({ ...c, [status]: !c[status] }))
                }
                className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
              >
                <span className="flex items-center gap-2">
                  <span className={cn("h-2 w-2 rounded-full", STATUS_DOT[status])} />
                  {STATUS_LABEL[status] || status}
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                    {list.length}
                  </Badge>
                </span>
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform",
                    isCollapsed && "-rotate-90"
                  )}
                />
              </button>

              {!isCollapsed && (
                <div className="space-y-1 mt-1">
                  {list.map((issue) => {
                    const isSelected = issue.id === selectedIssueId;
                    const createdAt = new Date(issue.created_at);
                    const ageDays = differenceInDays(new Date(), createdAt);
                    const isStale = ageDays >= 7 && issue.status !== "resolved";

                    return (
                      <button
                        key={issue.id}
                        onClick={() => onSelect(issue.id)}
                        className={cn(
                          "w-full text-left px-2.5 py-2 rounded-md border border-transparent border-l-[3px] transition-colors",
                          STATUS_LEFT_BORDER[issue.status] || "border-l-border",
                          isSelected
                            ? "bg-accent border-border"
                            : "hover:bg-accent/50"
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <span
                            className={cn(
                              "mt-1.5 h-2 w-2 rounded-full shrink-0",
                              PRIORITY_DOT[issue.priority] || PRIORITY_DOT.low
                            )}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-foreground line-clamp-1">
                              {issue.title}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground mt-0.5">
                              {issue.rooms && (
                                <span className="inline-flex items-center gap-1 min-w-0">
                                  <MapPin className="h-3 w-3 shrink-0" />
                                  <span className="truncate">
                                    {issue.rooms.room_number}
                                  </span>
                                </span>
                              )}
                              <span>
                                {formatDistanceToNowStrict(createdAt, {
                                  addSuffix: true,
                                })}
                              </span>
                              {issue.comments_count > 0 && (
                                <span className="inline-flex items-center gap-0.5">
                                  <MessageCircle className="h-3 w-3" />
                                  {issue.comments_count}
                                </span>
                              )}
                              {issue.photos && issue.photos.length > 0 && (
                                <span className="inline-flex items-center gap-0.5">
                                  <Camera className="h-3 w-3" />
                                  {issue.photos.length}
                                </span>
                              )}
                              {isStale && (
                                <span className="inline-flex items-center gap-0.5 text-status-warning">
                                  <Hourglass className="h-3 w-3" />
                                  {ageDays}d
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
