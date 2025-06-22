
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ActivateRelocationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onActivate: (id: string) => Promise<void>;
  relocationId: string | null;
}

export function ActivateRelocationDialog({
  isOpen,
  onClose,
  onActivate,
  relocationId
}: ActivateRelocationDialogProps) {
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleActivate = async () => {
    if (!relocationId) return;
    
    setIsLoading(true);
    try {
      await onActivate(relocationId);
      setNotes("");
      onClose();
    } catch (error) {
      console.error("Error activating relocation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Activate Relocation</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="activation-notes">Activation Notes (Optional)</Label>
            <Textarea
              id="activation-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about the activation..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleActivate} disabled={isLoading}>
              {isLoading ? "Activating..." : "Activate Relocation"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
