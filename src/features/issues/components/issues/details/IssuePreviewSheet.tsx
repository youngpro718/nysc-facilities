
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { IssueDetails } from "./IssueDetails";

interface IssuePreviewSheetProps {
  issueId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Shared sheet wrapper that renders IssueDetails in a slide-over panel.
 * Use from any module (Court Operations, Dashboard, etc.) to preview
 * an issue without navigating away.
 */
export const IssuePreviewSheet = ({ issueId, open, onOpenChange }: IssuePreviewSheetProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg p-0 overflow-hidden flex flex-col">
        <IssueDetails
          issueId={issueId}
          onClose={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  );
};
