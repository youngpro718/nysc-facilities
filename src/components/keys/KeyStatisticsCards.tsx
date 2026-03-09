
import { StatusCard } from "@/components/ui/StatusCard";
import { Database, Package2, Users, List } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { KeyData } from "./types/KeyTypes";

interface KeyStatisticsCardsProps {
  keyStats: KeyData[] | undefined;
  isLoading: boolean;
}

export function KeyStatisticsCards({ keyStats, isLoading }: KeyStatisticsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        {Array(4).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-[110px] rounded-xl" />
        ))}
      </div>
    );
  }

  const stats = {
    totalKeys: keyStats?.length || 0,
    totalStock: keyStats?.reduce((acc, k) => acc + (k.total_quantity || 0), 0) || 0,
    assigned: keyStats?.reduce((acc, k) => acc + (k.assigned_count || k.active_assignments || 0), 0) || 0,
    available: keyStats?.reduce((acc, k) => acc + (k.available_quantity || 0), 0) || 0,
  };

  const lowAvailability = stats.totalStock > 0 && stats.available / stats.totalStock < 0.2;

  return (
    <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
      <StatusCard
        statusVariant="neutral"
        title="Total Keys"
        value={stats.totalKeys}
        subLabel="Key types registered"
        icon={Database}
      />
      <StatusCard
        statusVariant="info"
        title="Total Stock"
        value={stats.totalStock}
        subLabel="Physical keys"
        icon={Package2}
      />
      <StatusCard
        statusVariant={stats.assigned > 0 ? "info" : "neutral"}
        title="Assigned"
        value={stats.assigned}
        subLabel="Currently issued"
        icon={Users}
      />
      <StatusCard
        statusVariant={lowAvailability ? "warning" : "operational"}
        title="Available"
        value={stats.available}
        subLabel={lowAvailability ? "Low availability" : "Ready to assign"}
        icon={List}
      />
    </div>
  );
}
