import { formatDistanceToNow, differenceInDays, format } from "date-fns";
import {
  MapPin,
  User,
  Clock,
  MessageCircle,
  Camera,
  CheckCircle2,
  Hourglass,
  AlertCircle,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { QuickUpdateActions } from "../QuickUpdateActions";
import { ReporterProfile } from "../ReporterProfile";
import { RoomOccupantContext } from "../RoomOccupantContext";
import { MonitorButton } from "@shared/components/monitoring/MonitorButton";
import { IssueTypeBadge } from "@features/issues/components/issues/card/IssueTypeBadge";
import type { EnhancedIssue } from "@features/dashboard/hooks/useAdminIssuesData";

interface IssueDetailPanelProps {
  issue: EnhancedIssue | null;
  onUpdate: () => void;
}

const STATUS_STYLES: Record<string, { label: string; classes: string }> = {
  open: {
    label: "Open",
    classes: "bg-status-critical/10 text-status-critical border-status-critical/30",
  },
  in_progress: {
    label: "In Progress",
    classes: "bg-status-warning/10 text-status-warning border-status-warning/30",
  },
  resolved: {
    label: "Resolved",
    classes: "bg-status-operational/10 text-status-operational border-status-operational/30",
  },
};

const PRIORITY_DOT: Record<string, string> = {
  high: "bg-status-critical",
  medium: "bg-status-warning",
  low: "bg-status-neutral",
};

const STATUS_LEFT_BORDER: Record<string, string> = {
  open: "border-l-status-critical",
  in_progress: "border-l-status-warning",
  resolved: "border-l-status-operational",
};

export function IssueDetailPanel({ issue, onUpdate }: IssueDetailPanelProps) {
  if (!issue) {
    return (
      <div className="h-full flex items-center justify-center text-center p-8">
        <div className="space-y-2 max-w-xs">
          <AlertCircle className="h-10 w-10 text-muted-foreground/40 mx-auto" />
          <p className="text-sm text-muted-foreground">
            Select an issue from the list to see details, photos, reporter info,
            and quick actions.
          </p>
        </div>
      </div>
    );
  }

  const status = STATUS_STYLES[issue.status] ?? STATUS_STYLES.open;
  const priorityDot = PRIORITY_DOT[issue.priority] ?? PRIORITY_DOT.low;
  const leftBorder = STATUS_LEFT_BORDER[issue.status] ?? "border-l-border";
  const createdAt = new Date(issue.created_at);
  const ageDays = differenceInDays(new Date(), createdAt);
  const isStale = ageDays >= 7 && issue.status !== "resolved";
  const externalTicket = (issue as unknown as Record<string, unknown>)
    .external_ticket_number;

  return (
    <ScrollArea className="h-full">
      <div className="p-4 sm:p-5 space-y-4">
        {/* Header */}
        <Card className={cn("border-l-[3px]", leftBorder)}>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <span
                className={cn("mt-2 h-2.5 w-2.5 rounded-full shrink-0", priorityDot)}
                title={`${issue.priority} priority`}
              />
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold text-foreground leading-snug">
                  {issue.title}
                </h2>
                {issue.description && (
                  <p className="text-sm text-muted-foreground mt-1.5 whitespace-pre-wrap">
                    {issue.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <Badge
                variant="outline"
                className={cn("text-[10px] px-2 py-0 h-5 font-medium", status.classes)}
              >
                {issue.status === "resolved" ? (
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                ) : null}
                {status.label}
              </Badge>
              <IssueTypeBadge issueType={issue.issue_type} className="text-[10px]" />
              {isStale && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-2 py-0 h-5 bg-status-warning/10 text-status-warning border-status-warning/30"
                >
                  <Hourglass className="h-3 w-3 mr-1" />
                  {ageDays}d open
                </Badge>
              )}
              {externalTicket ? (
                <Badge variant="outline" className="text-[10px] px-2 py-0 h-5 font-mono">
                  #{String(externalTicket)}
                </Badge>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {issue.rooms && (
                <span className="inline-flex items-center gap-1 min-w-0">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">
                    {issue.rooms.room_number} · {issue.rooms.name}
                  </span>
                </span>
              )}
              {issue.reporter && (
                <span className="inline-flex items-center gap-1 min-w-0">
                  <User className="h-3 w-3 shrink-0" />
                  <span className="truncate">
                    {issue.reporter.first_name} {issue.reporter.last_name}
                  </span>
                </span>
              )}
              <span className="inline-flex items-center gap-1" title={format(createdAt, "PPp")}>
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(createdAt, { addSuffix: true })}
              </span>
              {issue.comments_count > 0 && (
                <span className="inline-flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" />
                  {issue.comments_count}
                </span>
              )}
              {issue.photos && issue.photos.length > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Camera className="h-3 w-3" />
                  {issue.photos.length}
                </span>
              )}
            </div>

            <div onClick={(e) => e.stopPropagation()}>
              <MonitorButton
                itemType="issue"
                itemId={issue.id}
                itemName={issue.title}
                itemDescription={issue.description}
                size="sm"
                variant="ghost"
              />
            </div>
          </CardContent>
        </Card>

        {/* Photos */}
        {issue.photos && issue.photos.length > 0 && (
          <div>
            <h5 className="text-sm font-medium mb-2 text-foreground">Photos</h5>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {issue.photos.map((photo, index) => (
                <a
                  key={index}
                  href={photo}
                  target="_blank"
                  rel="noreferrer"
                  className="block"
                >
                  <img
                    src={photo}
                    alt={`Issue photo ${index + 1}`}
                    className="w-full aspect-square object-cover rounded border hover:opacity-90"
                    loading="lazy"
                  />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Reporter */}
        {issue.reporter && <ReporterProfile reporter={issue.reporter} />}

        {/* Occupants */}
        {issue.room_occupants && issue.room_occupants.length > 0 && (
          <RoomOccupantContext occupants={issue.room_occupants} />
        )}

        {/* Quick actions */}
        <QuickUpdateActions issue={issue} onUpdate={onUpdate} />
      </div>
    </ScrollArea>
  );
}
