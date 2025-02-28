
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { IssueDetails } from "../details/IssueDetails";
import { ResolutionForm } from "../forms/ResolutionForm";
import { DialogState } from "@/hooks/useDialogManager";
import { useEffect } from "react";

interface IssueDialogManagerProps {
  dialogState: DialogState;
  onClose: () => void;
}

export const IssueDialogManager = ({ dialogState, onClose }: IssueDialogManagerProps) => {
  // Force dialog to close properly when route changes
  useEffect(() => {
    return () => {
      // Cleanup effect when component unmounts
      if (dialogState.isOpen) {
        onClose();
      }
    };
  }, [dialogState.isOpen, onClose]);

  const handleSheetOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  // Return null early if dialog is not open or has no type
  if (!dialogState.isOpen || !dialogState.type) {
    return null;
  }

  return (
    <>
      {dialogState.type === 'issueDetails' && (
        <Sheet 
          open={dialogState.isOpen} 
          onOpenChange={handleSheetOpenChange}
        >
          <SheetContent side="right" className="w-full sm:w-3/4 md:w-2/3 lg:w-1/2">
            <IssueDetails 
              issueId={dialogState.data?.issueId} 
              onClose={onClose}
            />
          </SheetContent>
        </Sheet>
      )}

      {dialogState.type === 'resolution' && (
        <Sheet 
          open={dialogState.isOpen} 
          onOpenChange={handleSheetOpenChange}
          forceMount
        >
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>Resolve Issue</SheetTitle>
            </SheetHeader>
            <ResolutionForm
              issueId={dialogState.data?.issueId}
              onSuccess={onClose}
              onCancel={onClose}
            />
          </SheetContent>
        </Sheet>
      )}
    </>
  );
};
