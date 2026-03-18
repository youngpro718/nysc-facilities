
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface SpareKeyPromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  isSubmitting?: boolean;
  currentSpareCount?: number;
}

export function SpareKeyPrompt({
  open,
  onOpenChange,
  onConfirm,
  isSubmitting = false,
  currentSpareCount = 0,
}: SpareKeyPromptProps) {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    if (!reason.trim()) return;
    onConfirm(reason);
    setReason("");
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Assign as Spare Key?</AlertDialogTitle>
          <AlertDialogDescription>
            This occupant already has this key assigned. You can assign it as a spare key.
            {currentSpareCount > 0 && (
              <p className="mt-2 text-yellow-600 dark:text-yellow-400 dark:text-yellow-500">
                Current spare keys: {currentSpareCount}/2
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <Label htmlFor="reason">Reason for spare key</Label>
          <Textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter the reason for assigning a spare key..."
            className="mt-2"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => {
            setReason("");
            onOpenChange(false);
          }}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm} 
            disabled={!reason.trim() || isSubmitting}>
            {isSubmitting ? "Assigning..." : "Assign as Spare"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
