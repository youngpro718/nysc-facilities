
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { EditSpaceDialogContent } from "./EditSpaceDialogContent";

interface EditSpaceDialogProps {
  id: string;
  type: "room" | "hallway" | "door";
  initialData?: any;
  trigger?: React.ReactNode;
}

export function EditSpaceDialog({ id, type, initialData, trigger }: EditSpaceDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    setOpen(false);
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      title={`Edit ${type.charAt(0).toUpperCase() + type.slice(1)}`}
    >
      {trigger || <Button variant="outline" size="sm">Edit</Button>}
      <EditSpaceDialogContent
        id={id}
        type={type}
        initialData={initialData}
        onSuccess={handleSuccess}
        onCancel={() => setOpen(false)}
      />
    </ResponsiveDialog>
  );
}
