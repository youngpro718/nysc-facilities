import { Archive, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export interface BoxOverviewItem {
  id: string;
  name: string;
  used: number;
  total: number;
}

interface MobileKeyBoxOverviewProps {
  boxes: BoxOverviewItem[];
  selectedId: string | null; // null = "All Boxes"
  onSelect: (id: string | null) => void;
}

export function MobileKeyBoxOverview({
  boxes,
  selectedId,
  onSelect,
}: MobileKeyBoxOverviewProps) {
  return (
    <div className="rounded-2xl border bg-card p-4 space-y-3">
      <h3 className="text-sm font-semibold">Key Box Overview</h3>
      <ScrollArea className="w-full">
        <div className="flex gap-3 pb-2">
          {boxes.map((b) => {
            const pct = b.total > 0 ? Math.round((b.used / b.total) * 100) : 0;
            const isActive = selectedId === b.id;
            return (
              <button
                key={b.id}
                onClick={() => onSelect(b.id)}
                className={cn(
                  "shrink-0 w-[148px] rounded-xl border bg-background p-3 text-left transition-all",
                  "touch-manipulation active:scale-[0.98]",
                  isActive
                    ? "ring-2 ring-primary border-primary"
                    : "border-border",
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Archive className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">{b.name}</span>
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  <span className="text-foreground font-medium">{b.used}</span>
                  {" / "}
                  {b.total} slots
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </button>
            );
          })}
          <button
            onClick={() => onSelect(null)}
            className={cn(
              "shrink-0 w-[120px] rounded-xl border bg-background p-3 text-left transition-all flex flex-col justify-between",
              "touch-manipulation active:scale-[0.98]",
              selectedId === null
                ? "ring-2 ring-primary border-primary"
                : "border-border",
            )}
          >
            <div>
              <div className="text-sm font-semibold mb-1">All Boxes</div>
              <div className="text-xs text-muted-foreground">
                {boxes.length} {boxes.length === 1 ? "box" : "boxes"}
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground self-end" />
          </button>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
