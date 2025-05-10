import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";

interface CreateLightingDialogProps {
  onFixtureCreated: () => void;
  onZoneCreated: () => void;
}

export function CreateLightingDialog({ onFixtureCreated, onZoneCreated }: CreateLightingDialogProps) {
  const [open, setOpen] = useState(false);

  // This is a placeholder component. In a real implementation, this would include forms
  // for creating lighting fixtures and zones.
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          <span>Add New</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Lighting Component</DialogTitle>
          <DialogDescription>
            Create a new lighting fixture or zone in the system.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <p className="text-muted-foreground">
            This is a placeholder implementation. In a real system, this would contain forms for adding new lighting fixtures and zones.
          </p>
          <div className="flex gap-4 justify-center">
            <Button 
              onClick={() => {
                // Simulate fixture creation
                onFixtureCreated();
                setOpen(false);
              }}
            >
              Add Fixture
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                // Simulate zone creation
                onZoneCreated();
                setOpen(false);
              }}
            >
              Add Zone
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
