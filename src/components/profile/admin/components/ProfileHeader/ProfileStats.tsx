import { Activity, Building2, Key, Shield } from "lucide-react";
import { AdminStats } from "../../types";

interface ProfileStatsProps {
  stats: AdminStats;
}

export function ProfileStats({ stats }: ProfileStatsProps) {
  const statItems = [
    {
      icon: Shield,
      label: "Active Users",
      value: stats.activeUsers,
    },
    {
      icon: Activity,
      label: "Pending Issues",
      value: stats.pendingIssues,
    },
    {
      icon: Key,
      label: "Total Keys",
      value: stats.totalKeys,
    },
    {
      icon: Building2,
      label: "Managed Buildings",
      value: stats.managedBuildings,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
      {statItems.map((item, index) => (
        <div
          key={index}
          className="flex items-center gap-4 p-4 rounded-lg bg-background/50"
        >
          <item.icon className="h-5 w-5 text-primary" />
          <div>
            <div className="text-sm font-medium">{item.label}</div>
            <div className="text-2xl font-bold">{item.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
