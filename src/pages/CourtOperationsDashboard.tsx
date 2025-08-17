import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InteractiveOperationsDashboard } from "@/components/court/InteractiveOperationsDashboard";
import { AssignmentManagementPanel } from "@/components/court/AssignmentManagementPanel";
import { SetTemporaryLocationDialog } from "@/components/court/SetTemporaryLocationDialog";
import { MapPin, Users } from "lucide-react";
import { useSearchParams } from "react-router-dom";

export const CourtOperationsDashboard = () => {

  const [tempLocationOpen, setTempLocationOpen] = useState(false);
  const [selectedCourtRoom, setSelectedCourtRoom] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'operations';

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

      </div>

      <Tabs
        value={tab}
        onValueChange={(val) =>
          setSearchParams({
            tab: val,
            room: searchParams.get('room') || undefined,
          })
        }
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="operations" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Operations Overview
          </TabsTrigger>
          <TabsTrigger value="assignments" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Manage Assignments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="operations">
          <InteractiveOperationsDashboard />
        </TabsContent>

        <TabsContent value="assignments">
          <AssignmentManagementPanel />
        </TabsContent>
      </Tabs>


      
      <SetTemporaryLocationDialog 
        open={tempLocationOpen} 
        onOpenChange={setTempLocationOpen}
        courtroomId={selectedCourtRoom}
      />
    </div>
  );
};