import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type StatusChipKey = "all" | "available" | "checked_out" | "missing";

interface Counts {
  all: number;
  available: number;
  checked_out: number;
  missing: number;
}

interface MobileKeyStatusChipsProps {
  active: StatusChipKey;
  onChange: (k: StatusChipKey) => void;
  counts: Counts;
  onOpenFilters?: () => void;
}

const CHIPS: {
  key: StatusChipKey;
  label: string;
  dot?: string;
  ring: string;
}[] = [
  { key: "all", label: "All", ring: "ring-primary" },
  {
    key: "available",
    label: "Available",
    dot: "bg-green-500",
    ring: "ring-green-500/40",
  },
  {
    key: "checked_out",
    label: "Checked Out",
    dot: "bg-orange-500",
    ring: "ring-orange-500/40",
  },
  {
    key: "missing",
    label: "Missing",
    dot: "bg-destructive",
    ring: "ring-destructive/40",
  },
];

export function MobileKeyStatusChips({
  active,
  onChange,
  counts,
  onOpenFilters,
}: MobileKeyStatusChipsProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4">
      {CHIPS.map((c) => {
        const isActive = active === c.key;
        const count = counts[c.key];
        return (
          <button
            key={c.key}
            onClick={() => onChange(c.key)}
            className={cn(
              "flex items-center gap-2 shrink-0 h-11 px-4 rounded-xl border bg-card transition-all",
              "touch-manipulation active:scale-[0.97]",
              isActive
                ? cn("ring-2 ring-offset-0", c.ring)
                : "border-border text-foreground",
            )}
          >
            {c.dot && <span className={cn("h-2 w-2 rounded-full", c.dot)} />}
            <span className="text-sm font-medium">{c.label}</span>
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded-full tabular-nums",
                isActive
                  ? "bg-muted/60 text-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {count}
            </span>
          </button>
        );
      })}
      <Button
        variant="outline"
        size="icon"
        className="h-11 w-11 shrink-0 rounded-xl"
        onClick={onOpenFilters}
        aria-label="Filters"
      >
        <Filter className="h-4 w-4" />
      </Button>
    </div>
  );
}
