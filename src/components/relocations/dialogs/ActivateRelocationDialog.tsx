
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

interface ActivateRelocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  relocation: RoomRelocation;
  onConfirm: () => void;
  isLoading: boolean;
}

export function ActivateRelocationDialog({
  open,
  onOpenChange,
  relocation,
  onConfirm,
  isLoading,
}: ActivateRelocationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Activate Relocation</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to activate the relocation from{" "}
            {relocation.original_room_name || relocation.original_room_id} to{" "}
            {relocation.temporary_room_name || relocation.temporary_room_id}?
            This action will mark the relocation as active.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isLoading}>
            {isLoading ? "Activating..." : "Activate"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
