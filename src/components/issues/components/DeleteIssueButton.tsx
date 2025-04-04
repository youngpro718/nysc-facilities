import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash, AlertCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useIssueDirectDelete } from "../hooks/useIssueDirectDelete";

interface DeleteIssueButtonProps {
  issueId: string;
  /** Optional text to display on the button */
  text?: string;
  /** Called when the issue has been successfully deleted */
  onDelete?: () => void;
  /** If true, renders only the delete button without dropdown item wrapper */
  standalone?: boolean;
  /** Custom CSS classes to apply to the button */
  className?: string;
}

export function DeleteIssueButton({
  issueId,
  text = "Delete",
  onDelete,
  standalone = true,
  className = "",
}: DeleteIssueButtonProps) {
  const [open, setOpen] = useState(false);
  const [forceDelete, setForceDelete] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { deleteIssue, isDeleting } = useIssueDirectDelete();

  // Reset state when dialog closes
  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      setForceDelete(false);
      setErrorMessage(null);
    }
  };

  const handleDelete = async () => {
    setErrorMessage(null);

    try {
      console.log(`Attempting to delete issue with ID: ${issueId}, force: ${forceDelete}`);

      try {
        // This will throw an enhanced error if it fails
        await deleteIssue(issueId, forceDelete);

        // If we get here, the delete was successful
        setOpen(false);
        if (onDelete) {
          onDelete();
        }
      } catch (error: any) {
        console.error("Error deleting issue:", error);

        // Check if this is a constraint error that requires force delete
        if (error.requiresForce ||
            (error.response?.data?.requiresForce) ||
            error.message?.includes('constraints') ||
            error.message?.includes('force=true')) {

          setForceDelete(true);
          setErrorMessage(
            "Unable to delete due to database constraints. The force delete option has been automatically selected. Click Delete again to attempt to remove all references to this issue."
          );
        } else if (error.response?.status === 404) {
          // Issue not found
          setErrorMessage("This issue may have already been deleted. Please refresh the page.");
        } else {
          // Generic error
          setErrorMessage(error.message || error.response?.data?.message || "An unknown error occurred");
        }
      }
    } catch (outerError: any) {
      // This catches any errors in our error handling itself
      console.error("Unexpected error in delete handler:", outerError);
      setErrorMessage("An unexpected error occurred. Please try again.");
    }
  };

  const renderDialogContent = () => (
    <AlertDialogContent onClick={(e) => e.stopPropagation()} className="z-[100]">
      <AlertDialogHeader>
        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
        <AlertDialogDescription>
          This action cannot be undone. This will permanently delete the issue
          and remove it from our servers.
        </AlertDialogDescription>
      </AlertDialogHeader>

      {errorMessage && (
        <div className="bg-destructive/10 p-3 rounded-md flex items-start gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>{errorMessage}</div>
        </div>
      )}

      <div className="flex items-center space-x-2 pt-2">
        <Checkbox
          id={`force-delete-${issueId}`}
          checked={forceDelete}
          onCheckedChange={(checked) => setForceDelete(checked === true)}
        />
        <Label
          htmlFor={`force-delete-${issueId}`}
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Force delete (bypass constraints)
        </Label>
      </div>

      <AlertDialogFooter>
        <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
        <AlertDialogAction
          onClick={(e) => {
            e.stopPropagation();
            handleDelete();
          }}
          className="bg-destructive hover:bg-destructive/90"
          disabled={isDeleting}
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );

  // If used inside a DropdownMenuItem (not standalone)
  if (!standalone) {
    return (
      <AlertDialog open={open} onOpenChange={handleOpenChange}>
        <AlertDialogTrigger asChild>
          <div
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="w-full cursor-pointer px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10 flex items-center rounded-sm"
          >
            <Trash className="h-4 w-4 mr-2" />
            {text}
          </div>
        </AlertDialogTrigger>
        {renderDialogContent()}
      </AlertDialog>
    );
  }

  // Default standalone button with trigger
  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`text-destructive hover:text-destructive hover:bg-destructive/10 ${className}`}
          disabled={isDeleting}
        >
          <Trash className="h-4 w-4 mr-2" />
          {text}
        </Button>
      </AlertDialogTrigger>
      {renderDialogContent()}
    </AlertDialog>
  );
}