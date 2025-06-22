
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface CompleteRelocationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (id: string) => Promise<void>;
  relocationId: string | null;
}

export function CompleteRelocationDialog({
  isOpen,
  onClose,
  onComplete,
  relocationId
}: CompleteRelocationDialogProps) {
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleComplete = async () => {
    if (!relocationId) return;
    
    setIsLoading(true);
    try {
      await onComplete(relocationId);
      setNotes("");
      onClose();
    } catch (error) {
      console.error("Error completing relocation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete Relocation</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="completion-notes">Completion Notes (Optional)</Label>
            <Textarea
              id="completion-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about the completion..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleComplete} disabled={isLoading}>
              {isLoading ? "Completing..." : "Complete Relocation"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
