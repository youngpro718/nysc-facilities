
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
import { RoomRelocation } from "../types/relocationTypes";

interface CancelRelocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  relocation: RoomRelocation;
  onConfirm: () => void;
  isLoading: boolean;
}

export function CancelRelocationDialog({
  open,
  onOpenChange,
  relocation,
  onConfirm,
  isLoading,
}: CancelRelocationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel Relocation</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to cancel the relocation from{" "}
            {relocation.original_room_name || relocation.original_room_id} to{" "}
            {relocation.temporary_room_name || relocation.temporary_room_id}?
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm} 
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? "Cancelling..." : "Cancel Relocation"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
