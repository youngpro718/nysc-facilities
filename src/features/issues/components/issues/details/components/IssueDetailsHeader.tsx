
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Pencil, X } from "lucide-react";
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
}

export const IssueDetailsHeader = ({ title, status, issueId, onEdit, onDelete, isEditing }: IssueDetailsHeaderProps) => {
  return (
    <DialogHeader className="px-6 pt-6 pr-12">
      <DialogTitle className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-xl font-bold break-words">{title}</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            className="h-8 w-8 flex-shrink-0"
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
        <div className="flex items-center gap-2 flex-wrap">
          <IssueStatusBadge status={status} />
        </div>
      </DialogTitle>
    </DialogHeader>
  );
};
