import { formatDistanceToNowStrict, format, differenceInDays } from "date-fns";
import {
  ArrowLeftRight,
  Building2,
  Calendar,
  KeyRound,
  Mail,
  Search,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { KeyAssignment } from "../types/assignmentTypes";

interface KeyAssignmentListProps {
  assignments: KeyAssignment[] | undefined;
  isProcessing: boolean;
  onReturnKey: (assignmentId: string, keyId: string) => void;
  onEditAssignment?: (assignment: KeyAssignment) => void;
}

const TYPE_LABEL: Record<string, string> = {
  physical_key: "Physical",
  room_key: "Room",
  elevator_pass: "Elevator",
};

function ageBadge(days: number) {
  if (days >= 180)
    return "bg-status-critical/10 text-status-critical border-status-critical/30";
  if (days >= 90)
    return "bg-status-warning/10 text-status-warning border-status-warning/30";
  return "bg-muted text-muted-foreground border-border";
}

export function KeyAssignmentList({
  assignments,
  isProcessing,
  onReturnKey,
  onEditAssignment,
}: KeyAssignmentListProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "spare" | "passkey" | "external">(
    "all"
  );

  const filtered = useMemo(() => {
    const list = assignments || [];
    return list.filter((a) => {
      if (filter === "spare" && !a.is_spare) return false;
      if (filter === "passkey" && !a.keys?.is_passkey) return false;
      if (filter === "external" && a.occupant) return false;
      if (query) {
        const q = query.toLowerCase();
        const recipient = a.occupant
          ? `${a.occupant.first_name} ${a.occupant.last_name}`
          : a.recipient_name || "";
        const haystack = [
          recipient,
          a.occupant?.department || "",
          a.occupant?.email || a.recipient_email || "",
          a.keys?.name || "",
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [assignments, query, filter]);

  const filters: { id: typeof filter; label: string; count: number }[] = [
    { id: "all", label: "All", count: assignments?.length || 0 },
    {
      id: "spare",
      label: "Spare",
      count: (assignments || []).filter((a) => a.is_spare).length,
    },
    {
      id: "passkey",
      label: "Passkey",
      count: (assignments || []).filter((a) => a.keys?.is_passkey).length,
    },
    {
      id: "external",
      label: "External",
      count: (assignments || []).filter((a) => !a.occupant).length,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by holder, department, key…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {filters.map((f) => (
            <Button
              key={f.id}
              variant={filter === f.id ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f.id)}
              className="h-8"
            >
              {f.label}
              <span className="ml-1.5 text-[10px] opacity-70">{f.count}</span>
            </Button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground border border-dashed rounded-md">
          {query || filter !== "all"
            ? "No assignments match the current filters."
            : "No active key assignments."}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((a) => {
            const days = differenceInDays(new Date(), new Date(a.assigned_at));
            const recipient = a.occupant
              ? `${a.occupant.first_name} ${a.occupant.last_name}`
              : a.recipient_name || "Unknown";
            const email = a.occupant?.email || a.recipient_email;
            const dept = a.occupant?.department || (a.occupant ? "" : "External");
            const isPasskey = a.keys?.is_passkey;
            const isSpare = a.is_spare;

            return (
              <Card
                key={a.id}
                className={cn(
                  "border-l-[3px] transition-colors",
                  isPasskey ? "border-l-primary" : "border-l-border"
                )}
              >
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    {/* Left: key + holder */}
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-start gap-2">
                        <KeyRound className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-semibold text-sm text-foreground truncate">
                              {a.keys?.name || "—"}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 h-5"
                            >
                              {TYPE_LABEL[a.keys?.type || ""] || a.keys?.type}
                            </Badge>
                            {isPasskey && (
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 h-5 bg-primary/10 text-primary border-primary/30"
                              >
                                <ShieldCheck className="h-3 w-3 mr-0.5" />
                                Passkey
                              </Badge>
                            )}
                            {isSpare && (
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 h-5 bg-status-warning/10 text-status-warning border-status-warning/30"
                              >
                                <Sparkles className="h-3 w-3 mr-0.5" />
                                Spare
                              </Badge>
                            )}
                          </div>
                          {isSpare && a.spare_key_reason && (
                            <div className="text-[11px] text-muted-foreground mt-0.5">
                              Reason: {a.spare_key_reason}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground pl-6">
                        <span className="inline-flex items-center gap-1 text-foreground/90">
                          <User className="h-3 w-3" />
                          <span className="font-medium">{recipient}</span>
                        </span>
                        {dept && (
                          <span className="inline-flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {dept}
                          </span>
                        )}
                        {email && (
                          <span className="inline-flex items-center gap-1 min-w-0">
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate">{email}</span>
                          </span>
                        )}
                        <span
                          className="inline-flex items-center gap-1"
                          title={format(new Date(a.assigned_at), "PPp")}
                        >
                          <Calendar className="h-3 w-3" />
                          {formatDistanceToNowStrict(new Date(a.assigned_at), {
                            addSuffix: true,
                          })}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn("text-[10px] px-1.5 py-0 h-4", ageBadge(days))}
                        >
                          {days}d held
                        </Badge>
                      </div>
                    </div>

                    {/* Right: actions */}
                    <div className="flex items-center gap-2 shrink-0 sm:self-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditAssignment?.(a)}
                        className="h-9 min-w-[44px]"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onReturnKey(a.id, a.keys?.id || "")}
                        disabled={isProcessing}
                        className="h-9 min-w-[44px]"
                      >
                        <ArrowLeftRight className="mr-1.5 h-4 w-4" />
                        Return
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
