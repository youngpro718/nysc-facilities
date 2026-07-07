import { useState } from "react";
import { formatDistanceToNow, differenceInDays } from "date-fns";
import {
  MapPin,
  User,
  Clock,
  MessageCircle,
  Users,
  ChevronDown,
  ChevronUp,
  Camera,
  CheckCircle2,
  Hourglass,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { QuickUpdateActions } from "./QuickUpdateActions";
import { ReporterProfile } from "./ReporterProfile";
import { RoomOccupantContext } from "./RoomOccupantContext";
import { MonitorButton } from "@shared/components/monitoring/MonitorButton";
import { IssueTypeBadge } from "@features/issues/components/issues/card/IssueTypeBadge";
import type { EnhancedIssue } from "@features/dashboard/hooks/useAdminIssuesData";

interface EnhancedIssueCardProps {
  issue: EnhancedIssue;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onUpdate: () => void;
}

// Tinted pill badges for status (per project memory)
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

// Solid dot for priority (per project memory)
const PRIORITY_DOT: Record<string, string> = {
  critical: "bg-status-critical",
  high: "bg-status-critical",
  medium: "bg-status-warning",
  low: "bg-status-neutral",
};

const STATUS_LEFT_BORDER: Record<string, string> = {
  open: "border-l-status-critical",
  in_progress: "border-l-status-warning",
  resolved: "border-l-status-operational",
};

export function EnhancedIssueCard({
  issue,
  isSelected,
  onSelect,
  onUpdate,
}: EnhancedIssueCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const status = STATUS_STYLES[issue.status] ?? STATUS_STYLES.open;
  const priorityDot = PRIORITY_DOT[issue.priority] ?? PRIORITY_DOT.low;
  const leftBorder = STATUS_LEFT_BORDER[issue.status] ?? "border-l-border";

  const createdAt = new Date(issue.created_at);
  const ageDays = differenceInDays(new Date(), createdAt);
  const isStale = ageDays >= 7 && issue.status !== "resolved";
  const isCritical = ((issue.priority as string) === "critical" || issue.priority === "high") && issue.status !== "resolved";

  const externalTicket = (
    issue as unknown as Record<string, unknown>
  ).external_ticket_number;

  return (
    <Card
      className={cn(
        "border-l-2 transition-all duration-200",
        leftBorder,
        isSelected && "ring-2 ring-primary",
        isCritical && "shadow-sm"
      )}
    >
      <CardContent className="p-3 sm:p-4 space-y-2.5">
        {/* Row 1: selection + status + priority dot + title + expand */}
        <div className="flex items-start gap-3">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onSelect}
            className="mt-1 shrink-0"
            aria-label="Select issue"
          />

          {/* Priority dot */}
          <span
            className={cn(
              "mt-2 h-2.5 w-2.5 rounded-full shrink-0",
              priorityDot
            )}
            aria-label={`${issue.priority} priority`}
            title={`${issue.priority} priority`}
          />

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-sm leading-tight text-foreground line-clamp-2 flex-1">
                {issue.title}
              </h3>
              <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 shrink-0 -mt-1 -mr-1"
                    aria-label={isExpanded ? "Collapse" : "Expand"}
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </Collapsible>
            </div>

            {/* Description */}
            {issue.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {issue.description}
              </p>
            )}
          </div>
        </div>

        {/* Row 2: status pill + type + age + stale/external badges */}
        <div className="flex flex-wrap items-center gap-1.5 pl-7">
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
            <Badge
              variant="outline"
              className="text-[10px] px-2 py-0 h-5 font-mono"
            >
              #{String(externalTicket)}
            </Badge>
          ) : null}
        </div>

        {/* Row 3: meta info — room, reporter, age, comments, photos */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground pl-7">
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

          <span className="inline-flex items-center gap-1">
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

          {!isExpanded &&
            issue.room_occupants &&
            issue.room_occupants.length > 0 && (
              <span className="inline-flex items-center gap-1">
                <Users className="h-3 w-3" />
                {issue.room_occupants.length} occupant
                {issue.room_occupants.length > 1 ? "s" : ""}
              </span>
            )}
        </div>

        {/* Monitor button — kept small, right-aligned */}
        <div className="pl-7" onClick={(e) => e.stopPropagation()}>
          <MonitorButton
            itemType="issue"
            itemId={issue.id}
            itemName={issue.title}
            itemDescription={issue.description}
            size="sm"
            variant="ghost"
          />
        </div>

        {/* Expanded content */}
        <Collapsible open={isExpanded}>
          <CollapsibleContent className="space-y-4 pt-2 pl-7 border-t border-border/50">
            {issue.reporter && <ReporterProfile reporter={issue.reporter} />}

            {issue.room_occupants && issue.room_occupants.length > 0 && (
              <RoomOccupantContext occupants={issue.room_occupants} />
            )}

            {issue.photos && issue.photos.length > 0 && (() => {
              const safe = safePhotoUrls(issue.photos);
              if (safe.length === 0) return null;
              return (
              <div>
                <h5 className="text-sm font-medium mb-2 text-foreground">Photos</h5>
                <div className="flex gap-2 overflow-x-auto">
                  {safe.slice(0, 3).map((photo, index) => (
                    <img
                      key={index}
                      src={photo}
                      alt={`Issue photo ${index + 1}`}
                      className="w-16 h-16 object-cover rounded border"
                      loading="lazy"
                    />
                  ))}
                  {safe.length > 3 && (
                    <div className="w-16 h-16 bg-muted rounded border flex items-center justify-center text-xs text-muted-foreground">
                      +{safe.length - 3}
                    </div>
                  )}
                </div>
              </div>
              );
            })()}


            <QuickUpdateActions issue={issue} onUpdate={onUpdate} />
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
