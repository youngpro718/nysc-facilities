import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { SimpleReportWizard } from "./wizard/SimpleReportWizard";
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
      <SimpleReportWizard 
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
