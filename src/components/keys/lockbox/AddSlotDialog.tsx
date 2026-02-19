// @ts-nocheck
import { useState } from "react";
import { getErrorMessage } from "@/lib/errorUtils";
import { logger } from '@/lib/logger';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";

interface AddSlotDialogProps {
  lockboxId: string;
  lockboxName?: string;
  existingSlotCount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddSlotDialog({ lockboxId, lockboxName, existingSlotCount, open, onOpenChange, onSuccess }: AddSlotDialogProps) {
  const [label, setLabel] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!label.trim()) {
      toast.error("Please enter a label for the key slot");
      return;
    }

    setIsCreating(true);
    try {
      const newSlotNumber = existingSlotCount + 1;

      const { data: slot, error } = await supabase
        .from('lockbox_slots')
        .insert({
          lockbox_id: lockboxId,
          slot_number: newSlotNumber,
          label: label.trim(),
          room_number: roomNumber.trim() || null,
          quantity,
          status: 'in_box',
        })
        .select()
        .single();

      if (error) throw error;

      // Log the activity
      await supabase.from('lockbox_activity_logs').insert({
        slot_id: slot.id,
        action: 'status_change',
        status_after: 'in_box',
        note: notes.trim() ? `Added new slot: ${notes.trim()}` : `Added new key slot "${label.trim()}"`,
      });

      toast.success(`Key slot "${label}" added to ${lockboxName || 'lockbox'}`);
      onSuccess();
      onOpenChange(false);
      
      // Reset
      setLabel("");
      setRoomNumber("");
      setQuantity(1);
      setNotes("");
    } catch (error) {
      logger.error('Error adding slot:', error);
      toast.error(getErrorMessage(error) || "Failed to add key slot");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Add Key Slot
          </DialogTitle>
          {lockboxName && (
            <p className="text-sm text-muted-foreground">Adding to {lockboxName}</p>
          )}
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Label <span className="text-destructive">*</span></Label>
            <Input 
              placeholder="e.g. Courtroom 401 Main" 
              value={label} 
              onChange={(e) => setLabel(e.target.value)}
              disabled={isCreating}
            />
          </div>

          <div className="space-y-2">
            <Label>Room Number</Label>
            <Input 
              placeholder="e.g. 401" 
              value={roomNumber} 
              onChange={(e) => setRoomNumber(e.target.value)}
              disabled={isCreating}
            />
          </div>

          <div className="space-y-2">
            <Label>Key Quantity</Label>
            <Input 
              type="number" 
              min={1} 
              max={10}
              value={quantity} 
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              disabled={isCreating}
            />
          </div>

          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea 
              placeholder="Any additional details about this key..." 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)}
              disabled={isCreating}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isCreating}>
            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Key Slot
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
