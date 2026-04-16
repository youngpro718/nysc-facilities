
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
    <DialogHeader className="px-6 pt-5 pb-3 border-b space-y-2">
      <DialogTitle className="flex items-center gap-2 flex-wrap pr-10">
        <h2 className="text-lg font-semibold leading-snug break-words">{title}</h2>
        <IssueStatusBadge status={status} />
      </DialogTitle>
      <div className="flex items-center justify-end gap-1">
        {actions}
        <Button
          variant="ghost"
          size="icon"
          onClick={onEdit}
          className="h-8 w-8"
        >
          {isEditing ? (
            <X className="h-4 w-4" />
          ) : (
            <Pencil className="h-4 w-4" />
          )}
          <span className="sr-only">
            {isEditing ? "Cancel edit" : "Edit issue"}
          </span>
        </Button>
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
