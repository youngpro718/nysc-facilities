/**
 * GlobalKPIStrip — 4 StatusCard KPIs for the admin dashboard
 * Shows: Active Issues, System Health %, Tasks Pending, Maintenance Queue
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { StatusCard, StatusVariant } from "@/components/ui/StatusCard";
import { AlertTriangle, Activity, ClipboardList, Wrench } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface KPIData {
  activeIssues: number;
  criticalIssues: number;
  systemHealth: number;
  tasksPending: number;
  maintenanceQueue: number;
  maintenanceActive: number;
}

function useGlobalKPIs() {
  return useQuery<KPIData>({
    queryKey: ["global-kpis"],
    queryFn: async () => {
      const [issuesRes, fixturesRes, tasksRes, maintenanceRes] = await Promise.all([
        supabase
          .from("issues")
          .select("id, status, priority")
          .neq("status", "resolved"),
        supabase
          .from("lighting_fixtures")
          .select("status"),
        supabase
          .from("supply_requests")
          .select("id, status")
          .eq("status", "submitted"),
        supabase
          .from("issues")
          .select("id, status")
          .neq("status", "resolved"),
      ]);

      const issues = issuesRes.data || [];
      const fixtures = fixturesRes.data || [];
      const tasks = tasksRes.data || [];
      const maintenance = maintenanceRes.data || [];

      const totalFixtures = fixtures.length;
      const functionalFixtures = fixtures.filter(
        (f) => f.status === "functional" || f.status === "working"
      ).length;

      return {
        activeIssues: issues.length,
        criticalIssues: issues.filter((i) => i.priority === "high").length,
        systemHealth: totalFixtures > 0
          ? Math.round((functionalFixtures / totalFixtures) * 100)
          : 100,
        tasksPending: tasks.length,
        maintenanceQueue: maintenance.length,
        maintenanceActive: maintenance.filter((m) => m.status === "in_progress").length,
      };
    },
    staleTime: 60_000,
  });
}

function getIssueVariant(active: number, critical: number): StatusVariant {
  if (critical > 0) return "critical";
  if (active > 0) return "warning";
  return "operational";
}

function getHealthVariant(pct: number): StatusVariant {
  if (pct >= 90) return "operational";
  if (pct >= 70) return "warning";
  return "critical";
}

export function GlobalKPIStrip() {
  const { data, isLoading } = useGlobalKPIs();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[110px] rounded-xl" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatusCard
        statusVariant={getIssueVariant(data.activeIssues, data.criticalIssues)}
        title="Active Issues"
        value={data.activeIssues}
        subLabel={`${data.criticalIssues} critical`}
        icon={AlertTriangle}
      />
      <StatusCard
        statusVariant={getHealthVariant(data.systemHealth)}
        title="System Health"
        value={`${data.systemHealth}%`}
        subLabel="Across all buildings"
        icon={Activity}
      />
      <StatusCard
        statusVariant={data.tasksPending > 0 ? "warning" : "operational"}
        title="Tasks Pending"
        value={data.tasksPending}
        subLabel="Awaiting review"
        icon={ClipboardList}
      />
      <StatusCard
        statusVariant="info"
        title="Maintenance Queue"
        value={data.maintenanceQueue}
        subLabel={`${data.maintenanceActive} active`}
        icon={Wrench}
      />
    </div>
  );
}
