
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { MaintenanceScheduleCalendar } from "./maintenance/MaintenanceScheduleCalendar";
import { MaintenanceHistoryTable } from "./maintenance/MaintenanceHistoryTable";
import { MaintenanceStats } from "./maintenance/MaintenanceStats";
import { ScheduleMaintenanceDialog } from "./ScheduleMaintenanceDialog";

export function MaintenanceView() {
  const [openScheduleDialog, setOpenScheduleDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("schedule");
  
  const { data: upcomingMaintenance, isLoading: loadingUpcoming } = useQuery({
    queryKey: ['upcoming-maintenance'],
    queryFn: async () => {
      // In a real implementation, this would fetch from the lighting_maintenance_schedules table
      const { data, error } = await supabase
        .from('lighting_maintenance_schedules')
        .select('*')
        .gte('scheduled_date', new Date().toISOString())
        .order('scheduled_date', { ascending: true })
        .limit(5);
        
      if (error) throw error;
      return data || [];
    }
  });
  
  const { data: maintenanceStats, isLoading: loadingStats } = useQuery({
    queryKey: ['maintenance-stats'],
    queryFn: async () => {
      // Placeholder for maintenance statistics
      // This would typically come from a database view or calculation
      return {
        overdueCount: 3,
        scheduledCount: 8,
        completedThisMonth: 12,
        averageResolutionDays: 2.4,
      };
    }
  });
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Lighting Maintenance</h2>
        <Button 
          onClick={() => setOpenScheduleDialog(true)}
          className="flex items-center gap-2"
        >
          <Calendar className="h-4 w-4" />
          Schedule Maintenance
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-amber-50 border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-amber-700 flex items-center text-sm font-medium">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Overdue Maintenance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700">
              {loadingStats ? '...' : maintenanceStats?.overdueCount}
            </div>
            <p className="text-xs text-amber-600 mt-1">Requires immediate attention</p>
          </CardContent>
        </Card>
        
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-blue-700 flex items-center text-sm font-medium">
              <Clock className="h-4 w-4 mr-2" />
              Scheduled
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">
              {loadingStats ? '...' : maintenanceStats?.scheduledCount}
            </div>
            <p className="text-xs text-blue-600 mt-1">Upcoming maintenance tasks</p>
          </CardContent>
        </Card>
        
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-green-700 flex items-center text-sm font-medium">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Completed This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              {loadingStats ? '...' : maintenanceStats?.completedThisMonth}
            </div>
            <p className="text-xs text-green-600 mt-1">Avg resolution: {maintenanceStats?.averageResolutionDays} days</p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="schedule">Calendar</TabsTrigger>
          <TabsTrigger value="history">Maintenance History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="schedule" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <MaintenanceScheduleCalendar />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance History</CardTitle>
            </CardHeader>
            <CardContent>
              <MaintenanceHistoryTable />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <MaintenanceStats />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <ScheduleMaintenanceDialog 
        open={openScheduleDialog} 
        onOpenChange={setOpenScheduleDialog}
      />
    </div>
  );
}
