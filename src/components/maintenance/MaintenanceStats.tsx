import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, AlertTriangle, Clock, CheckCircle, Wrench, DollarSign } from "lucide-react";

export const MaintenanceStats = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["maintenance-stats"],
    queryFn: async () => {
      // Get maintenance schedules stats
      const { data: schedules } = await supabase
        .from("maintenance_schedules")
        .select("status, estimated_cost");

      // Get maintenance issues stats  
      const { data: issues } = await supabase
        .from("issues")
        .select("status, priority")
        .eq("issue_type", "maintenance");

      const totalSchedules = schedules?.length || 0;
      const scheduled = schedules?.filter(s => s.status === "scheduled").length || 0;
      const inProgress = schedules?.filter(s => s.status === "in_progress").length || 0;
      const completed = schedules?.filter(s => s.status === "completed").length || 0;

      const totalIssues = issues?.length || 0;
      const openIssues = issues?.filter(i => i.status === "open").length || 0;
      const urgentIssues = issues?.filter(i => i.priority === "urgent" || i.priority === "critical").length || 0;

      const totalCost = schedules?.reduce((sum, s) => sum + (s.estimated_cost || 0), 0) || 0;

      return {
        totalSchedules,
        scheduled,
        inProgress,
        completed,
        totalIssues,
        openIssues,
        urgentIssues,
        totalCost,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Schedules</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.totalSchedules || 0}</div>
          <p className="text-xs text-muted-foreground">
            {stats?.scheduled || 0} scheduled, {stats?.inProgress || 0} in progress
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Open Issues</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.openIssues || 0}</div>
          <p className="text-xs text-muted-foreground">
            {stats?.urgentIssues || 0} urgent issues
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          <Wrench className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.inProgress || 0}</div>
          <p className="text-xs text-muted-foreground">
            Active maintenance tasks
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.completed || 0}</div>
          <p className="text-xs text-muted-foreground">
            Est. ${(stats?.totalCost || 0).toLocaleString()}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
