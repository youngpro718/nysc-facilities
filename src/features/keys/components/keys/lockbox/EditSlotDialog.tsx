import { useState, useEffect } from "react";
import { getErrorMessage } from "@/lib/errorUtils";
import { logger } from '@/lib/logger';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, Edit3 } from "lucide-react";
import { LockboxSlot } from "../types/LockboxTypes";
import { useQuery } from "@tanstack/react-query";
import { RoomSelector } from "./RoomSelector";

interface EditSlotDialogProps {
  slot: LockboxSlot | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditSlotDialog({ slot, open, onOpenChange, onSuccess }: EditSlotDialogProps) {
  const [label, setLabel] = useState("");
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomNumber, setRoomNumber] = useState<string | null>(null);
  const [targetLockboxId, setTargetLockboxId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isUpdating, setIsUpdating] = useState(false);

  const { data: lockboxes } = useQuery({
    queryKey: ["lockboxes-for-move"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lockboxes')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: open
  });

  useEffect(() => {
    if (slot) {
      setLabel(slot.label);
      setRoomId(slot.room_id || null);
      setRoomNumber(slot.room_number || null);
      setTargetLockboxId(slot.lockbox_id);
      setQuantity(slot.quantity || 1);
    }
  }, [slot]);

  const handleRoomChange = (newRoomId: string | null, newRoomNumber: string | null) => {
    setRoomId(newRoomId);
    setRoomNumber(newRoomNumber);
  };

  const handleUpdate = async () => {
    if (!slot || !label.trim()) {
      toast.error("Please enter a slot label");
      return;
    }

    setIsUpdating(true);
    try {
      const updates: Record<string, unknown> = {
        label: label.trim(),
        room_id: roomId,
        room_number: roomNumber || null,
        quantity: quantity,
        updated_at: new Date().toISOString()
      };

      // Check if we're moving to a different lockbox
      const isMoving = targetLockboxId !== slot.lockbox_id;
      if (isMoving) {
        updates.lockbox_id = targetLockboxId;
      }

      const { error: updateError } = await supabase
        .from('lockbox_slots')
        .update(updates)
        .eq('id', slot.id);

      if (updateError) throw updateError;

      // Log the activity
      const { data: { user } } = await supabase.auth.getUser();
      
      let noteText = `Updated label to "${label}"`;
      if (isMoving) {
        noteText = `Moved to different lockbox. ${noteText}`;
      }
      if (roomId !== slot.room_id) {
        noteText += roomId ? `. Linked to room ${roomNumber}` : `. Unlinked from room`;
      }

      const { error: logError } = await supabase
        .from('lockbox_activity_logs')
        .insert({
          slot_id: slot.id,
          action: 'edit_details',
          status_before: slot.status,
          status_after: slot.status,
          actor_user_id: user?.id,
          actor_name: user?.email,
          note: noteText
        });

      if (logError) logger.error('Error logging activity:', logError);

      toast.success(isMoving ? "Slot moved successfully" : "Slot updated successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      logger.error('Error updating slot:', error);
      toast.error(getErrorMessage(error) || "Failed to update slot");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            Edit Slot Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Slot Label <span className="text-destructive">*</span></Label>
            <Input 
              placeholder="e.g. Master Key, Office 101" 
              value={label} 
              onChange={(e) => setLabel(e.target.value)}
              disabled={isUpdating}
            />
          </div>

          <div className="space-y-2">
            <Label>Room</Label>
            <RoomSelector
              value={roomId || undefined}
              roomNumber={roomNumber || undefined}
              onChange={handleRoomChange}
              disabled={isUpdating}
            />
            <p className="text-xs text-muted-foreground">
              Link this key slot to a room in the system
            </p>
          </div>

          <div className="space-y-2">
            <Label>Number of Keys <span className="text-destructive">*</span></Label>
            <Input 
              type="number"
              min="1"
              placeholder="e.g. 1, 2, 3" 
              value={quantity} 
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              disabled={isUpdating}
            />
            <p className="text-xs text-muted-foreground">
              How many physical keys are in this slot
            </p>
          </div>

          <div className="space-y-2">
            <Label>Move to Lockbox</Label>
            <Select value={targetLockboxId} onValueChange={setTargetLockboxId} disabled={isUpdating}>
              <SelectTrigger>
                <SelectValue placeholder="Select lockbox..." />
              </SelectTrigger>
              <SelectContent>
                {lockboxes?.map((lockbox) => (
                  <SelectItem key={lockbox.id} value={lockbox.id}>
                    {lockbox.name} {lockbox.location_description && `- ${lockbox.location_description}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Change this to move the slot to a different lockbox
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUpdating}>
            Cancel
          </Button>
          <Button onClick={handleUpdate} disabled={isUpdating}>
            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
