import { cn } from "@/lib/utils";

export interface StatStripItem {
  label: string;
  value: number | string;
  /** Optional extra context, shown on wide screens only. */
  sub?: string;
  /** Status dot color; omit for no dot. */
  tone?: "operational" | "warning" | "critical" | "info" | "neutral";
}

const toneDot: Record<NonNullable<StatStripItem["tone"]>, string> = {
  operational: "bg-emerald-500",
  warning: "bg-amber-500",
  critical: "bg-red-500",
  info: "bg-blue-500",
  neutral: "bg-muted-foreground/40",
};

/**
 * Compact one-line metric strip — replaces grids of large stat cards on
 * feature pages. Numbers stay scannable without each metric claiming a
 * 110px card, which read as "empty dashboard" when values are mostly zero.
 */
export function StatStrip({
  items,
  className,
}: {
  items: StatStripItem[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-stretch rounded-md border bg-card/50 divide-x divide-border overflow-hidden",
        className,
      )}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-baseline gap-2 px-4 py-2.5 min-w-0"
        >
          {item.tone && (
            <span
              className={cn(
                "h-2 w-2 rounded-full self-center shrink-0",
                toneDot[item.tone],
              )}
              aria-hidden="true"
            />
          )}
          <span className="text-lg font-semibold tabular-nums leading-none">
            {item.value}
          </span>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {item.label}
          </span>
          {item.sub && (
            <span className="hidden xl:inline text-xs text-muted-foreground/70 truncate">
              · {item.sub}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
