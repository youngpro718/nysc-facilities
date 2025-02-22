
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Pencil, X } from "lucide-react";
import { IssueStatusBadge } from "../../card/IssueStatusBadge";
import { IssueStatus } from "../../types/IssueTypes";

interface IssueDetailsHeaderProps {
  title: string;
  status: IssueStatus;
  onEdit: () => void;
  isEditing: boolean;
}

export const IssueDetailsHeader = ({ title, status, onEdit, isEditing }: IssueDetailsHeaderProps) => {
  return (
    <DialogHeader className="px-6 pt-6">
      <DialogTitle className="flex items-center justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <h2 className="text-xl font-bold truncate">{title}</h2>
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
        </div>
        <div className="flex items-center gap-2">
          <IssueStatusBadge status={status} />
        </div>
      </DialogTitle>
    </DialogHeader>
  );
};
