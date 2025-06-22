
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface CancelRelocationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCancel: (id: string) => Promise<void>;
  relocationId: string | null;
}

export function CancelRelocationDialog({
  isOpen,
  onClose,
  onCancel,
  relocationId
}: CancelRelocationDialogProps) {
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCancel = async () => {
    if (!relocationId) return;
    
    setIsLoading(true);
    try {
      await onCancel(relocationId);
      setReason("");
      onClose();
    } catch (error) {
      console.error("Error cancelling relocation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel Relocation</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="cancel-reason">Cancellation Reason</Label>
            <Textarea
              id="cancel-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide a reason for cancellation..."
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCancel} 
              disabled={isLoading || !reason.trim()}
            >
              {isLoading ? "Cancelling..." : "Cancel Relocation"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
