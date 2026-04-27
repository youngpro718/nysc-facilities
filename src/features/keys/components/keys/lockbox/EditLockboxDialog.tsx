import { useState, useEffect } from "react";
import { getErrorMessage } from "@/lib/errorUtils";
import { logger } from '@/lib/logger';
import { DialogFooter } from "@/components/ui/dialog";
import { ModalFrame } from "@shared/components/common/common/ModalFrame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Lockbox } from "../types/LockboxTypes";

interface EditLockboxDialogProps {
  lockbox: Lockbox | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditLockboxDialog({ lockbox, open, onOpenChange, onSuccess }: EditLockboxDialogProps) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (lockbox) {
      setName(lockbox.name);
      setLocation(lockbox.location_description || "");
      setNotes(lockbox.notes || "");
    }
  }, [lockbox]);

  const handleUpdate = async () => {
    if (!lockbox || !name.trim()) {
      toast.error("Please enter a lockbox name");
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('lockboxes')
        .update({
          name: name.trim(),
          location_description: location.trim() || null,
          notes: notes.trim() || null
        })
        .eq('id', lockbox.id);

      if (error) throw error;

      toast.success(`Lockbox "${name}" updated successfully`);
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      logger.error('Error updating lockbox:', error);
      toast.error(getErrorMessage(error) || "Failed to update lockbox");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <ModalFrame open={open} onOpenChange={onOpenChange} size="sm" title="Edit Lockbox">

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Lockbox Name <span className="text-destructive">*</span></Label>
            <Input 
              placeholder="e.g. Security Office Lockbox" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              disabled={isUpdating}
            />
          </div>

          <div className="space-y-2">
            <Label>Location / Room</Label>
            <Input 
              placeholder="e.g. 17th Floor - Room 1701" 
              value={location} 
              onChange={(e) => setLocation(e.target.value)}
              disabled={isUpdating}
            />
          </div>

          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea 
              placeholder="Any additional information..." 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)}
              disabled={isUpdating}
            />
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
    </ModalFrame>
  );
}
