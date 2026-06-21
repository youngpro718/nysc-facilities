import { ReportIssueDialog } from "@features/operations/components/maintenance/ReportIssueDialog";
import type { UserAssignment } from "@/types/dashboard";

export interface IssueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  assignedRooms?: UserAssignment[];
}

export function IssueDialog({ open, onOpenChange, onSuccess }: IssueDialogProps) {
  return (
    <ReportIssueDialog
      open={open}
      onOpenChange={onOpenChange}
      mode="requester"
      onSuccess={onSuccess}
    />
  );
}
