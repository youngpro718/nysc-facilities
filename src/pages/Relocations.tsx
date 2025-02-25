
import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { RelocationsList } from "@/components/relocations/RelocationsList";
import { RelocationDialog } from "@/components/relocations/RelocationDialog";
import { RelocationCalendar } from "@/components/relocations/RelocationCalendar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const Relocations = () => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  return (
    <div className="space-y-8">
      <DashboardHeader />
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Room Relocations</h1>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Relocation
        </Button>
      </div>
      
      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
        </TabsList>
        <TabsContent value="list">
          <RelocationsList />
        </TabsContent>
        <TabsContent value="calendar">
          <RelocationCalendar />
        </TabsContent>
      </Tabs>
      
      <RelocationDialog 
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
};

export default Relocations;
