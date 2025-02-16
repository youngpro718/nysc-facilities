
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { BuildingsGrid } from "@/components/dashboard/BuildingsGrid";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Lightbulb, AlertTriangle } from "lucide-react";

const Index = () => {
  const {
    buildings,
    buildingsLoading,
    issues,
    activities,
    handleMarkAsSeen,
  } = useDashboardData();

  const { data: lightingStatus, isLoading: lightingLoading } = useQuery({
    queryKey: ['room-lighting-status'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('room_lighting_status')
        .select('*');
      
      if (error) throw error;
      
      // Calculate totals
      const totals = data.reduce((acc, room) => ({
        workingFixtures: acc.workingFixtures + Number(room.working_fixtures),
        nonWorkingFixtures: acc.nonWorkingFixtures + Number(room.non_working_fixtures),
        totalFixtures: acc.totalFixtures + Number(room.total_fixtures)
      }), { workingFixtures: 0, nonWorkingFixtures: 0, totalFixtures: 0 });

      return {
        rooms: data,
        totals
      };
    }
  });

  const workingPercentage = lightingStatus?.totals.totalFixtures 
    ? (lightingStatus.totals.workingFixtures / lightingStatus.totals.totalFixtures) * 100
    : 0;

  return (
    <div className="space-y-8">
      <DashboardHeader />
      
      {/* Lighting Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Lighting System Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {lightingLoading ? (
            <div>Loading lighting status...</div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Working Fixtures</span>
                  </div>
                  <span className="text-sm font-bold">{workingPercentage.toFixed(1)}%</span>
                </div>
                <Progress value={workingPercentage} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-green-500" />
                  <div>
                    <div className="text-sm text-muted-foreground">Working</div>
                    <div className="text-lg font-bold">{lightingStatus?.totals.workingFixtures || 0}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <div>
                    <div className="text-sm text-muted-foreground">Need Attention</div>
                    <div className="text-lg font-bold">{lightingStatus?.totals.nonWorkingFixtures || 0}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <BuildingsGrid
        buildings={buildings}
        isLoading={buildingsLoading}
        issues={issues}
        activities={activities}
        onMarkAsSeen={handleMarkAsSeen}
      />
    </div>
  );
};

export default Index;
