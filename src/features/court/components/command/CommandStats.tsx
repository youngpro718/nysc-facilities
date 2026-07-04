/**
 * CommandStats — four command-level numbers as a StatStrip. Each metric is
 * described; the whole strip is informational (click-throughs live on the
 * panels and alert bar).
 */
import { StatStrip } from "@/components/ui/StatStrip";

export function CommandStats({
  keysOut,
  overdueKeys,
  courtroomsSittingToday,
  courtroomsWithIssues,
  isWeekend,
}: {
  keysOut: number;
  overdueKeys: number;
  courtroomsSittingToday: number;
  courtroomsWithIssues: number;
  isWeekend: boolean;
}) {
  return (
    <StatStrip
      items={[
        { label: "keys out", value: keysOut, tone: keysOut > 0 ? "info" : "neutral" },
        {
          label: "overdue returns",
          value: overdueKeys,
          tone: overdueKeys > 0 ? "critical" : "operational",
        },
        {
          label: isWeekend ? "parts sitting (weekend)" : "parts sitting today",
          value: courtroomsSittingToday,
          tone: "neutral",
        },
        {
          label: "courtrooms with issues",
          value: courtroomsWithIssues,
          tone: courtroomsWithIssues > 0 ? "warning" : "operational",
        },
      ]}
    />
  );
}
