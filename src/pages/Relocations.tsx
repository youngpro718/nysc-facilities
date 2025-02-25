
import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { RelocationsList } from "@/components/relocations/RelocationsList";
import { RelocationDialog } from "@/components/relocations/RelocationDialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

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
      
      <RelocationsList />
      
      <RelocationDialog 
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
};

export default Relocations;
