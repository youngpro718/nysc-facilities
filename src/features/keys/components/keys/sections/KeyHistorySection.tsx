import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNowStrict } from "date-fns";
import {
  ArrowLeftRight,
  CheckCircle2,
  History,
  KeyRound,
  PenSquare,
  PlusCircle,
  Search,
  Trash2,
  User,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { KeyAuditLog } from "../types/KeyTypes";

const ACTION_META: Record<
  string,
  { label: string; icon: typeof History; tone: string; dot: string }
> = {
  created: {
    label: "Created",
    icon: PlusCircle,
    tone: "bg-status-operational/10 text-status-operational border-status-operational/30",
    dot: "bg-status-operational",
  },
  assigned: {
    label: "Assigned",
    icon: ArrowLeftRight,
    tone: "bg-primary/10 text-primary border-primary/30",
    dot: "bg-primary",
  },
  returned: {
    label: "Returned",
    icon: CheckCircle2,
    tone: "bg-status-operational/10 text-status-operational border-status-operational/30",
    dot: "bg-status-operational",
  },
  updated: {
    label: "Updated",
    icon: PenSquare,
    tone: "bg-status-warning/10 text-status-warning border-status-warning/30",
    dot: "bg-status-warning",
  },
  deleted: {
    label: "Deleted",
    icon: Trash2,
    tone: "bg-status-critical/10 text-status-critical border-status-critical/30",
    dot: "bg-status-critical",
  },
};

const ACTION_FILTERS = ["all", "created", "assigned", "returned", "updated"] as const;
type ActionFilter = (typeof ACTION_FILTERS)[number];

export function KeyHistorySection() {
  const [query, setQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<ActionFilter>("all");

  const { data: history, isLoading } = useQuery({
    queryKey: ["key-audit-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("key_audit_logs")
        .select(`id, action_type, created_at, changes, key_id, performed_by`)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as KeyAuditLog[];
    },
  });

  // Lookup occupant names referenced in `changes.occupant_id`
  const occupantIds = useMemo(() => {
    const set = new Set<string>();
    (history || []).forEach((log) => {
      const occId = (log.changes as Record<string, unknown>)?.occupant_id as
        | string
        | undefined;
      if (occId) set.add(occId);
    });
    return Array.from(set);
  }, [history]);

  const { data: occupantsMap } = useQuery({
    queryKey: ["audit-occupants-map", occupantIds.join(",")],
    enabled: occupantIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("occupants")
        .select("id, first_name, last_name")
        .in("id", occupantIds);
      if (error) throw error;
      const map: Record<string, string> = {};
      (data || []).forEach((o: any) => {
        map[o.id as string] = `${o.first_name ?? ""} ${o.last_name ?? ""}`.trim();
      });
      return map;
    },
  });

  // Lookup key names
  const keyIds = useMemo(() => {
    const set = new Set<string>();
    (history || []).forEach((log) => log.key_id && set.add(log.key_id));
    return Array.from(set);
  }, [history]);

  const { data: keysMap } = useQuery({
    queryKey: ["audit-keys-map", keyIds.join(",")],
    enabled: keyIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("keys")
        .select("id, name, type")
        .in("id", keyIds);
      if (error) throw error;
      const map: Record<string, { name: string; type: string }> = {};
      (data || []).forEach((k: any) => {
        map[k.id as string] = { name: k.name, type: k.type };
      });
      return map;
    },
  });

  const prettyLabel = (key: string) => {
    const m: Record<string, string> = {
      occupant_id: "Occupant",
      assigned_at: "Assigned",
      returned_at: "Returned",
      is_spare: "Spare key",
      recipient_type: "Recipient type",
      recipient_name: "Recipient name",
      recipient_email: "Recipient email",
      available_quantity: "Available",
      total_quantity: "Total",
    };
    return m[key] || key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const prettyValue = (key: string, value: unknown) => {
    if (key === "occupant_id") {
      const name = occupantsMap?.[value as string];
      return name || String(value);
    }
    if (/_at$/.test(key) && value) {
      try {
        return format(new Date(value as string), "MMM d, yyyy h:mm a");
      } catch {
        return String(value);
      }
    }
    if (typeof value === "boolean") return value ? "Yes" : "No";
    return String(value);
  };

  const filtered = useMemo(() => {
    return (history || []).filter((log) => {
      if (actionFilter !== "all" && log.action_type !== actionFilter) return false;
      if (query) {
        const q = query.toLowerCase();
        const keyName = keysMap?.[log.key_id]?.name || "";
        const performer = log.username || log.email || "";
        const changesStr = Object.entries(log.changes || {})
          .map(([k, v]) => `${prettyLabel(k)} ${prettyValue(k, v)}`)
          .join(" ");
        const haystack =
          `${log.action_type} ${keyName} ${performer} ${changesStr}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [history, actionFilter, query, keysMap, occupantsMap]);

  const actionCounts = useMemo(() => {
    const c: Record<string, number> = { all: history?.length || 0 };
    (history || []).forEach((l) => {
      c[l.action_type] = (c[l.action_type] || 0) + 1;
    });
    return c;
  }, [history]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Key History</h2>
        <p className="text-sm text-muted-foreground">
          Latest {history?.length || 0} key actions
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search key, person, change…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {ACTION_FILTERS.map((a) => (
            <Button
              key={a}
              variant={actionFilter === a ? "default" : "outline"}
              size="sm"
              onClick={() => setActionFilter(a)}
              className="h-8 capitalize"
            >
              {a}
              <span className="ml-1.5 text-[10px] opacity-70">
                {actionCounts[a] || 0}
              </span>
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground border border-dashed rounded-md">
          No history entries match the current filters.
        </div>
      ) : (
        <ScrollArea className="max-h-[calc(100svh-440px)] min-h-[320px] pr-2">
          <div className="space-y-2">
            {filtered.map((log) => {
              const meta = ACTION_META[log.action_type] || {
                label: log.action_type,
                icon: History,
                tone: "bg-muted text-muted-foreground border-border",
                dot: "bg-muted-foreground",
              };
              const Icon = meta.icon;
              const keyInfo = keysMap?.[log.key_id];
              const changes = Object.entries(log.changes || {});

              return (
                <Card key={log.id} className="border-l-[3px] border-l-border">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                          meta.tone
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant="outline"
                            className={cn("text-[10px] px-2 py-0 h-5", meta.tone)}
                          >
                            {meta.label}
                          </Badge>
                          {keyInfo && (
                            <span className="inline-flex items-center gap-1 text-sm font-medium text-foreground">
                              <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                              {keyInfo.name}
                            </span>
                          )}
                          <span
                            className="ml-auto text-[11px] text-muted-foreground"
                            title={format(new Date(log.created_at), "PPp")}
                          >
                            {formatDistanceToNowStrict(new Date(log.created_at), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>

                        {changes.length > 0 && (
                          <div className="text-xs text-muted-foreground space-y-0.5">
                            {changes.map(([k, v]) => (
                              <div key={k}>
                                <span className="font-medium text-foreground/80">
                                  {prettyLabel(k)}:
                                </span>{" "}
                                {prettyValue(k, v)}
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <User className="h-3 w-3" />
                          {log.username || log.email || "System"}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
