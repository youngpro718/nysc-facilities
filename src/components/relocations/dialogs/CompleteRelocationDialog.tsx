
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

interface CompleteRelocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  relocation: RoomRelocation;
  onConfirm: () => void;
  isLoading: boolean;
}

export function CompleteRelocationDialog({
  open,
  onOpenChange,
  relocation,
  onConfirm,
  isLoading,
}: CompleteRelocationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Complete Relocation</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to complete the relocation from{" "}
            {relocation.original_room_name || relocation.original_room_id} to{" "}
            {relocation.temporary_room_name || relocation.temporary_room_id}?
            This action will mark the relocation as completed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isLoading}>
            {isLoading ? "Completing..." : "Complete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
