import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CourtAvailabilityPanel } from "@/components/court/CourtAvailabilityPanel";
import { CourtTermsPanel } from "@/components/court/CourtTermsPanel";
import { CourtMaintenancePanel } from "@/components/court/CourtMaintenancePanel";
import { TermUploadDialog } from "@/components/court/TermUploadDialog";
import { TermScheduleView } from "@/components/court/TermScheduleView";
import { SetTemporaryLocationDialog } from "@/components/court/SetTemporaryLocationDialog";
import { AssignmentManagementPanel } from "@/components/court/AssignmentManagementPanel";
import { Button } from "@/components/ui/button";
import { Upload, MapPin, Calendar, Wrench, Users } from "lucide-react";

export const CourtOperationsDashboard = () => {
  const [termUploadOpen, setTermUploadOpen] = useState(false);
  const [tempLocationOpen, setTempLocationOpen] = useState(false);
  const [selectedCourtRoom, setSelectedCourtRoom] = useState<string | null>(null);
  const [selectedTermId, setSelectedTermId] = useState<string | null>(null);

  const handleSetTemporaryLocation = (courtroomId: string) => {
    setSelectedCourtRoom(courtroomId);
    setTempLocationOpen(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Court Operations</h1>
          <p className="text-muted-foreground">
            Manage courtrooms, terms, and maintenance schedules
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setTermUploadOpen(true)} variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Upload Term
          </Button>
        </div>
      </div>

      <Tabs defaultValue="availability" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="availability" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Courtroom Status
          </TabsTrigger>
          <TabsTrigger value="assignments" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Assignments
          </TabsTrigger>
          <TabsTrigger value="terms" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Current Terms
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Maintenance Impact
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Schedule Overview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="availability" className="space-y-4">
          <CourtAvailabilityPanel onSetTemporaryLocation={handleSetTemporaryLocation} />
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <AssignmentManagementPanel />
        </TabsContent>

        <TabsContent value="terms" className="space-y-4">
          <CourtTermsPanel onTermSelected={setSelectedTermId} />
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <CourtMaintenancePanel />
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          {selectedTermId ? (
            <TermScheduleView termId={selectedTermId} />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a term from the Terms tab to view its schedule</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <TermUploadDialog 
        open={termUploadOpen} 
        onOpenChange={setTermUploadOpen}
      />
      
      <SetTemporaryLocationDialog 
        open={tempLocationOpen} 
        onOpenChange={setTempLocationOpen}
        courtroomId={selectedCourtRoom}
      />
    </div>
  );
};