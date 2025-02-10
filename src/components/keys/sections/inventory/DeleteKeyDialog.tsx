
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
  return (
    <AlertDialog open={!!keyToDelete} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Key</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete {keyToDelete?.name}? This action cannot be undone.
            Keys with active assignments cannot be deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirmDelete}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
