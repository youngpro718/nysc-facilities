
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { KeyData } from "../../types/KeyTypes";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface DeleteKeyDialogProps {
  keyToDelete: KeyData | null;
  onOpenChange: (open: boolean) => void;
  onConfirmDelete: () => void;
}

export function DeleteKeyDialog({ 
  keyToDelete, 
  onOpenChange, 
  onConfirmDelete 
}: DeleteKeyDialogProps) {
  const hasActiveAssignments = keyToDelete?.total_quantity !== keyToDelete?.available_quantity;

  return (
    <AlertDialog open={!!keyToDelete} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Key</AlertDialogTitle>
          {hasActiveAssignments ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This key cannot be deleted because it has active assignments. 
                Please ensure all keys are returned before deleting.
              </AlertDescription>
            </Alert>
          ) : (
            <AlertDialogDescription>
              Are you sure you want to delete {keyToDelete?.name}? This action cannot be undone.
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          {!hasActiveAssignments && (
            <AlertDialogAction onClick={onConfirmDelete}>Delete</AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
