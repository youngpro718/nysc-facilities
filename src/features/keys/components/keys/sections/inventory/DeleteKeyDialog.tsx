import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { KeyData } from "../../types/KeyTypes";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface DeleteKeyDialogProps {
  keyToDelete: KeyData | null;
  onOpenChange: (open: boolean) => void;
  onConfirmDelete: () => void;
  onForceDelete?: () => Promise<void> | void;
}

export function DeleteKeyDialog({
  keyToDelete,
  onOpenChange,
  onConfirmDelete,
  onForceDelete,
}: DeleteKeyDialogProps) {
  const canDelete =
    keyToDelete?.available_quantity === keyToDelete?.total_quantity;
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!keyToDelete) setBusy(false);
  }, [keyToDelete]);

  const handleForce = async () => {
    if (!onForceDelete) return;
    setBusy(true);
    try {
      await onForceDelete();
    } finally {
      setBusy(false);
    }
  };

  return (
    <AlertDialog open={!!keyToDelete} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Key</AlertDialogTitle>
          {!canDelete ? (
            <div className="space-y-3">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This key has active assignments. You can force-delete it —
                  all active assignments will be marked returned first.
                </AlertDescription>
              </Alert>
              <AlertDialogDescription>
                Force-delete <strong>{keyToDelete?.name}</strong>? This returns
                every active assignment, then permanently deletes the key. This
                action cannot be undone.
              </AlertDialogDescription>
            </div>
          ) : (
            <AlertDialogDescription>
              Are you sure you want to delete {keyToDelete?.name}? This action
              cannot be undone.
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          {canDelete ? (
            <Button variant="destructive" onClick={onConfirmDelete}>
              Delete
            </Button>
          ) : (
            onForceDelete && (
              <Button
                variant="destructive"
                onClick={handleForce}
                disabled={busy}
              >
                {busy ? "Returning & deleting…" : "Return all & delete"}
              </Button>
            )
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
