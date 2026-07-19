
import { StatStrip } from "@/components/ui/StatStrip";
import { Skeleton } from "@/components/ui/skeleton";
import { KeyData } from "./types/KeyTypes";

interface KeyStatisticsCardsProps {
  keyStats: KeyData[] | undefined;
  isLoading: boolean;
}

export function KeyStatisticsCards({ keyStats, isLoading }: KeyStatisticsCardsProps) {
  if (isLoading) {
    return <Skeleton className="h-12 rounded-md" />;
  }

  const stats = {
    totalKeys: keyStats?.length || 0,
    totalStock: keyStats?.reduce((acc, k) => acc + (k.total_quantity || 0), 0) || 0,
    assigned: keyStats?.reduce((acc, k) => acc + (k.assigned_count || k.active_assignments || 0), 0) || 0,
    available: keyStats?.reduce((acc, k) => acc + (k.available_quantity || 0), 0) || 0,
  };

  const lowAvailability = stats.totalStock > 0 && stats.available / stats.totalStock < 0.2;
  // Stock that is neither assigned nor available (lost, damaged, retired) —
  // shown so the numbers visibly add up to the physical total.
  const unaccounted = Math.max(0, stats.totalStock - stats.assigned - stats.available);

  return (
    <StatStrip
      items={[
        { label: "key types", value: stats.totalKeys, tone: "neutral" },
        { label: "physical keys", value: stats.totalStock, tone: "info" },
        { label: "assigned", value: stats.assigned, tone: stats.assigned > 0 ? "info" : "neutral" },
        {
          label: "available",
          value: stats.available,
          sub: lowAvailability ? "low availability" : "ready to assign",
          tone: lowAvailability ? "warning" : "operational",
        },
        ...(unaccounted > 0
          ? [{
              label: "lost / damaged",
              value: unaccounted,
              tone: "warning" as const,
            }]
          : []),
      ]}
    />
  );
}
