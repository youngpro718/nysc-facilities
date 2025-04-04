
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
import { useDeleteIssueMutation } from "../hooks/mutations/useDeleteIssueMutation";

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
  const { deleteIssueMutation, isDeleteInProgress } = useDeleteIssueMutation();
  
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
      
      await deleteIssueMutation.mutateAsync({ 
        issueId, 
        force: forceDelete 
      });
      
      setOpen(false);
      if (onDelete) {
        onDelete();
      }
    } catch (error: any) {
      console.error("Error deleting issue:", error);
      setErrorMessage(error.message || "An unknown error occurred");
      
      // If the error message suggests constraints, recommend force delete
      if (error.message?.includes('violates foreign key constraint') || 
          error.message?.includes('constraint')) {
        setErrorMessage(
          "Unable to delete due to database constraints. You can try force deletion, which will attempt to remove all references to this issue."
        );
      }
    }
  };

  const renderDialogContent = () => (
    <AlertDialogContent>
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
          id="force-delete" 
          checked={forceDelete} 
          onCheckedChange={(checked) => setForceDelete(checked === true)}
        />
        <Label 
          htmlFor="force-delete" 
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Force delete (bypass constraints)
        </Label>
      </div>
      
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction
          onClick={handleDelete}
          className="bg-destructive hover:bg-destructive/90"
          disabled={isDeleteInProgress}
        >
          {isDeleteInProgress ? "Deleting..." : "Delete"}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );

  // If used inside a DropdownMenuItem (not standalone)
  if (!standalone) {
    return (
      <>
        <div 
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
          className="w-full cursor-pointer px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10 flex items-center rounded-sm"
        >
          <Trash className="h-4 w-4 mr-2" />
          {text}
        </div>
        
        <AlertDialog open={open} onOpenChange={handleOpenChange}>
          {renderDialogContent()}
        </AlertDialog>
      </>
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
          disabled={isDeleteInProgress}
        >
          <Trash className="h-4 w-4 mr-2" />
          {text}
        </Button>
      </AlertDialogTrigger>
      {renderDialogContent()}
    </AlertDialog>
  );
}
