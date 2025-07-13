
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { IssueWizard } from "./wizard/components/IssueWizard";
import type { UserAssignment } from "@/types/dashboard";

export interface IssueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  assignedRooms?: UserAssignment[];
}

export function IssueDialog({ open, onOpenChange, onSuccess, assignedRooms }: IssueDialogProps) {
  return (
    <ResponsiveDialog 
      open={open} 
      onOpenChange={onOpenChange}
      title=""
    >
      <IssueWizard 
        onSuccess={() => {
          onSuccess?.();
          onOpenChange(false);
        }}
        onCancel={() => onOpenChange(false)}
        assignedRooms={assignedRooms}
      />
    </ResponsiveDialog>
  );
}
