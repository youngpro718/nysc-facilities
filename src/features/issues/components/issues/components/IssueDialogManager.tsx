
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { IssueDetails } from "../details/IssueDetails";
import { ResolutionForm } from "../forms/ResolutionForm";
import { DialogState } from "@shared/hooks/useDialogManager";
import { useEffect, useRef } from "react";

interface IssueDialogManagerProps {
  dialogState: DialogState;
  onClose: () => void;
}

export const IssueDialogManager = ({ dialogState, onClose }: IssueDialogManagerProps) => {
  // Close the dialog when this component truly unmounts (route change).
  // IMPORTANT: deps must stay empty — `onClose` is recreated by the parent on
  // every render, so listing it made this cleanup fire on each re-render,
  // instantly closing dialogs opened via ?issue_id= deep links while the page
  // was still loading. The ref keeps the latest values without re-running.
  const latestRef = useRef({ isOpen: dialogState.isOpen, onClose });
  latestRef.current = { isOpen: dialogState.isOpen, onClose };
  useEffect(() => {
    return () => {
      if (latestRef.current.isOpen) {
        latestRef.current.onClose();
      }
    };
  }, []);

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
          <SheetContent
            side="right"
            className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl p-0 gap-0 flex flex-col"
          >
            <VisuallyHidden>
              <SheetTitle>Issue Details</SheetTitle>
            </VisuallyHidden>
            <IssueDetails 
              issueId={(dialogState.data as any)?.issueId} 
              onClose={onClose}
            />
          </SheetContent>
        </Sheet>
      )}

      {dialogState.type === 'resolution' && (
        <Sheet 
          open={dialogState.isOpen} 
          onOpenChange={handleSheetOpenChange}
        >
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>Resolve Issue</SheetTitle>
            </SheetHeader>
            <ResolutionForm
              issueId={(dialogState.data as any)?.issueId}
              onSuccess={onClose}
              onCancel={onClose}
            />
          </SheetContent>
        </Sheet>
      )}
    </>
  );
};
