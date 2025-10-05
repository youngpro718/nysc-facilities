import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MaintenanceScheduleList } from "@/components/maintenance/MaintenanceScheduleList";
import { MaintenanceIssuesList } from "@/components/maintenance/MaintenanceIssuesList";
import { MaintenanceStats } from "@/components/maintenance/MaintenanceStats";
import { MaintenanceCalendar } from "@/components/maintenance/MaintenanceCalendar";
import { ScheduleMaintenanceDialog } from "@/components/maintenance/ScheduleMaintenanceDialog";
import { ReportIssueDialog } from "@/components/maintenance/ReportIssueDialog";
import { Button } from "@/components/ui/button";
import { Calendar, AlertTriangle, Plus, Wrench, List, CalendarDays } from "lucide-react";

export const MaintenanceDashboard = () => {
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Maintenance</h1>
          <p className="text-muted-foreground">
            Track schedules, manage issues, and monitor facility upkeep
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIssueDialogOpen(true)} variant="outline">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Report Issue
          </Button>
          <Button onClick={() => setScheduleDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Schedule Maintenance
          </Button>
        </div>
      </div>

      <MaintenanceStats />

      <Tabs defaultValue="scheduled" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="scheduled" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Schedule
          </TabsTrigger>
          <TabsTrigger value="issues" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Issues & Repairs
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Calendar View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scheduled" className="space-y-4">
          <MaintenanceScheduleList />
        </TabsContent>

        <TabsContent value="issues" className="space-y-4">
          <MaintenanceIssuesList />
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <MaintenanceCalendar />
        </TabsContent>
      </Tabs>

      <ScheduleMaintenanceDialog 
        open={scheduleDialogOpen} 
        onOpenChange={setScheduleDialogOpen}
      />
      
      <ReportIssueDialog 
        open={issueDialogOpen} 
        onOpenChange={setIssueDialogOpen}
      />
    </div>
  );
};