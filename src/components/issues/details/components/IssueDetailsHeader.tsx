
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { IssueStatusBadge } from "../../card/IssueStatusBadge";

interface IssueDetailsHeaderProps {
  title: string;
  status: string;
  onEdit: () => void;
}

export const IssueDetailsHeader = ({ title, status, onEdit }: IssueDetailsHeaderProps) => {
  return (
    <DialogHeader>
      <DialogTitle className="text-xl font-bold flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>{title}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            className="h-8 w-8"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
        <IssueStatusBadge status={status} />
      </DialogTitle>
    </DialogHeader>
  );
};
