
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Pencil, X, CheckCircle2, Plus } from "lucide-react";
import { IssueStatusBadge } from "../../card/IssueStatusBadge";
import { IssueStatus } from "../../types/IssueTypes";
import { DeleteIssueButton } from "../../components/DeleteIssueButton";

interface IssueDetailsHeaderProps {
  title: string;
  status: IssueStatus;
  issueId?: string;
  onEdit: () => void;
  onDelete?: () => void;
  isEditing: boolean;
  /** Slot for action buttons (Resolve, Create Task) */
  actions?: React.ReactNode;
}

export const IssueDetailsHeader = ({ title, status, issueId, onEdit, onDelete, isEditing, actions }: IssueDetailsHeaderProps) => {
  return (
    <DialogHeader className="px-6 pt-6 pb-4 border-b space-y-3 pr-14">
      <DialogTitle className="flex items-start gap-3 flex-wrap">
        {/* DialogTitle already renders an <h2>; a nested heading is invalid DOM */}
        <span className="text-xl font-semibold leading-tight break-words flex-1 min-w-0">{title}</span>
        <IssueStatusBadge status={status} />
      </DialogTitle>
      <div className="flex items-center justify-end gap-1 flex-wrap">
        {actions}
        {isEditing ? (
          // Labeled explicitly (not a bare icon) so it doesn't read as a
          // second close button next to the sheet's own X in the corner.
          <Button variant="ghost" size="sm" onClick={onEdit} className="h-8 gap-1.5 text-xs">
            <X className="h-3.5 w-3.5" />
            Cancel Edit
          </Button>
        ) : (
          <Button variant="ghost" size="icon" onClick={onEdit} className="h-8 w-8">
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Edit issue</span>
          </Button>
        )}
        {!isEditing && issueId && (
          <DeleteIssueButton
            issueId={issueId}
            onDelete={onDelete}
            className="h-8 w-8 p-0"
          />
        )}
      </div>
    </DialogHeader>
  );
};
