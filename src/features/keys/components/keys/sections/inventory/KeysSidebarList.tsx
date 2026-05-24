import { useMemo, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ChevronDown, KeyRound, Shield } from "lucide-react";
import { KeyData } from "../../types/KeyTypes";

interface KeysSidebarListProps {
  keys: KeyData[];
  selectedKeyId?: string | null;
  onSelect: (key: KeyData) => void;
  isLoading?: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  physical_key: "Physical Keys",
  room_key: "Room Keys",
  elevator_pass: "Elevator Passes",
};

const TYPE_ORDER = ["physical_key", "room_key", "elevator_pass"];

export function KeysSidebarList({
  keys,
  selectedKeyId,
  onSelect,
  isLoading,
}: KeysSidebarListProps) {
  const grouped = useMemo(() => {
    const map = new Map<string, KeyData[]>();
    for (const k of keys) {
      const t = k.type || "physical_key";
      const list = map.get(t) || [];
      list.push(k);
      map.set(t, list);
    }
    return Array.from(map.entries()).sort(
      ([a], [b]) => TYPE_ORDER.indexOf(a) - TYPE_ORDER.indexOf(b)
    );
  }, [keys]);

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const toggle = (t: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(t) ? next.delete(t) : next.add(t);
      return next;
    });

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="px-3 py-2 border-b bg-muted/30 rounded-t-md flex items-center justify-between shrink-0">
        <p className="text-sm font-medium text-muted-foreground">Keys</p>
        {keys.length > 0 && (
          <Badge variant="secondary" className="text-xs">
            {keys.length}
          </Badge>
        )}
      </div>

      <ScrollArea className="flex-1 min-h-0">
        {isLoading ? (
          <div className="p-3 space-y-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-14 rounded-md" />
            ))}
          </div>
        ) : grouped.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No keys found
          </div>
        ) : (
          <div>
            {grouped.map(([type, items]) => {
              const isCollapsed = collapsed.has(type);
              return (
                <div key={type}>
                  <button
                    type="button"
                    onClick={() => toggle(type)}
                    className="w-full text-left px-3 py-2 flex items-center gap-2 bg-muted/40 hover:bg-muted/60 transition-colors border-b sticky top-0 z-10"
                  >
                    <KeyRound className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-xs font-semibold text-muted-foreground truncate flex-1">
                      {TYPE_LABELS[type] || type}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 h-5 shrink-0"
                    >
                      {items.length}
                    </Badge>
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 text-muted-foreground transition-transform shrink-0",
                        isCollapsed && "-rotate-90"
                      )}
                    />
                  </button>

                  {!isCollapsed && (
                    <ul className="divide-y">
                      {items.map((k) => {
                        const isActive = k.id === selectedKeyId;
                        const out = k.available_quantity === 0;
                        const low =
                          !out &&
                          k.total_quantity > 0 &&
                          k.available_quantity / k.total_quantity <= 0.25;
                        const dot = out
                          ? "bg-status-critical"
                          : low
                          ? "bg-status-warning"
                          : "bg-status-operational";

                        return (
                          <li key={k.id}>
                            <button
                              type="button"
                              onClick={() => onSelect(k)}
                              className={cn(
                                "w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-accent/60 transition-colors",
                                isActive && "bg-accent/60"
                              )}
                            >
                              <span
                                className={cn(
                                  "h-2.5 w-2.5 rounded-full shrink-0",
                                  dot
                                )}
                              />

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="truncate font-medium text-sm text-foreground">
                                    {k.name}
                                  </span>
                                  {k.is_passkey && (
                                    <Badge
                                      variant="secondary"
                                      className="text-[10px] px-1.5 py-0 h-4 shrink-0"
                                    >
                                      Passkey
                                    </Badge>
                                  )}
                                  {k.captain_office_copy && (
                                    <Shield
                                      className="h-3 w-3 text-status-operational shrink-0"
                                      aria-label="Captain's Office has copy"
                                    />
                                  )}
                                </div>
                                <div className="truncate text-xs text-muted-foreground mt-0.5">
                                  {k.available_quantity}/{k.total_quantity} available
                                  {k.active_assignments > 0 && (
                                    <span> · {k.active_assignments} assigned</span>
                                  )}
                                </div>
                              </div>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
