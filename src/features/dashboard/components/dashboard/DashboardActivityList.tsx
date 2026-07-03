/**
 * DashboardActivityList — merged chronological view of the user's supply
 * orders, issues, and task requests. Desktop-wide rows; the same data the
 * page already fetches (no new queries).
 */
import type { ElementType } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Package, Send, AlertTriangle, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface SupplyRequestRow {
  id: string;
  title?: string;
  status: string;
  created_at: string;
}
interface IssueRow {
  id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  unified_spaces?: { name?: string | null; room_number?: string | null } | null;
}
interface TaskRow {
  id: string;
  title: string;
  status: string;
  task_type?: string;
  created_at: string;
}

interface ActivityRow {
  id: string;
  kind: "supply" | "issue" | "task";
  title: string;
  status: string;
  location?: string;
  createdAt: string;
}

const KIND_META: Record<ActivityRow["kind"], { icon: ElementType; label: string }> = {
  supply: { icon: Package, label: "Supply" },
  issue: { icon: AlertTriangle, label: "Issue" },
  task: { icon: Send, label: "Request" },
};

const DONE_STATUSES = ["completed", "fulfilled", "resolved", "cancelled", "rejected"];

export function DashboardActivityList({
  supplyRequests,
  issues,
  taskRequests,
  limit = 8,
}: {
  supplyRequests: SupplyRequestRow[];
  issues: IssueRow[];
  taskRequests: TaskRow[];
  limit?: number;
}) {
  const navigate = useNavigate();

  const rows: ActivityRow[] = [
    ...supplyRequests.map((r) => ({
      id: r.id,
      kind: "supply" as const,
      title: r.title || "Supply order",
      status: r.status,
      createdAt: r.created_at,
    })),
    ...issues.map((i) => ({
      id: i.id,
      kind: "issue" as const,
      title: i.title,
      status: i.status,
      location: i.unified_spaces?.room_number
        ? `Room ${i.unified_spaces.room_number}`
        : i.unified_spaces?.name ?? undefined,
      createdAt: i.created_at,
    })),
    ...taskRequests.map((t) => ({
      id: t.id,
      kind: "task" as const,
      title: t.title,
      status: t.status,
      createdAt: t.created_at,
    })),
  ]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, limit);

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Nothing yet — your orders, requests, and reported issues will show up here.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0 divide-y divide-border">
        {rows.map((row) => {
          const meta = KIND_META[row.kind];
          const Icon = meta.icon;
          const done = DONE_STATUSES.includes(row.status);
          return (
            <button
              key={`${row.kind}-${row.id}`}
              onClick={() => navigate(row.kind === "issue" ? "/my-issues" : "/my-requests")}
              aria-label={`${meta.label}: ${row.title}, ${row.status.replace(/_/g, " ")}`}
              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-accent transition-colors"
            >
              <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span className="hidden md:inline text-xs text-muted-foreground w-16 shrink-0">
                {meta.label}
              </span>
              <span className="flex-1 min-w-0 truncate text-sm font-medium">{row.title}</span>
              {row.location && (
                <span className="hidden lg:inline text-xs text-muted-foreground shrink-0">
                  {row.location}
                </span>
              )}
              <Badge
                variant={done ? "secondary" : "outline"}
                className="text-[10px] px-1.5 py-0 capitalize shrink-0"
              >
                {row.status.replace(/_/g, " ")}
              </Badge>
              <span className="hidden sm:inline text-xs text-muted-foreground tabular-nums shrink-0 w-24 text-right">
                {formatDistanceToNow(new Date(row.createdAt), { addSuffix: true })}
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 opacity-40" aria-hidden="true" />
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
