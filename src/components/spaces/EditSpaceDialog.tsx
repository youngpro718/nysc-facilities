
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { EditHallwayForm } from "./forms/hallway/EditHallwayForm";

interface EditSpaceDialogProps {
  id: string;
  type: "room" | "hallway" | "door";
  initialData?: any;
  trigger?: React.ReactNode;
  onSpaceUpdated?: () => void;
}

export function EditSpaceDialog({ id, type, initialData, trigger, onSpaceUpdated }: EditSpaceDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    setOpen(false);
    onSpaceUpdated?.();
  };

  const renderContent = () => {
    if (type === 'hallway') {
      return (
        <EditHallwayForm
          id={id}
          initialData={initialData}
          onSuccess={handleSuccess}
          onCancel={() => setOpen(false)}
        />
      );
    }
    
    // For other types, return a placeholder for now
    return (
      <div className="p-4">
        <p>Editing {type} is not yet implemented.</p>
        <Button onClick={() => setOpen(false)}>Close</Button>
      </div>
    );
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      title={`Edit ${type.charAt(0).toUpperCase() + type.slice(1)}`}
    >
      {trigger || <Button variant="outline" size="sm">Edit</Button>}
      {renderContent()}
    </ResponsiveDialog>
  );
}
