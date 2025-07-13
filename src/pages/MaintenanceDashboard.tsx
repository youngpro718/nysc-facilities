import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MaintenanceScheduleList } from "@/components/maintenance/MaintenanceScheduleList";
import { MaintenanceIssuesList } from "@/components/maintenance/MaintenanceIssuesList";
import { ScheduleMaintenanceDialog } from "@/components/maintenance/ScheduleMaintenanceDialog";
import { ReportIssueDialog } from "@/components/maintenance/ReportIssueDialog";
import { Button } from "@/components/ui/button";
import { Calendar, AlertTriangle, Plus, Wrench } from "lucide-react";

export const MaintenanceDashboard = () => {
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Maintenance Management</h1>
          <p className="text-muted-foreground">
            Schedule maintenance, track issues, and manage facility upkeep
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

      <Tabs defaultValue="scheduled" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="scheduled" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Scheduled Maintenance
          </TabsTrigger>
          <TabsTrigger value="issues" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Issues & Repairs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scheduled" className="space-y-4">
          <MaintenanceScheduleList />
        </TabsContent>

        <TabsContent value="issues" className="space-y-4">
          <MaintenanceIssuesList />
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