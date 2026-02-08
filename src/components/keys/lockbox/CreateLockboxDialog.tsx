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
import { Loader2 } from "lucide-react";

interface CreateLockboxDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateLockboxDialog({ open, onOpenChange, onSuccess }: CreateLockboxDialogProps) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [slotCount, setSlotCount] = useState(10);
  const [notes, setNotes] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Please enter a lockbox name");
      return;
    }

    setIsCreating(true);
    try {
      // 1. Create the lockbox
      const { data: lockbox, error: lockboxError } = await supabase
        .from('lockboxes')
        .insert({
          name: name.trim(),
          location_description: location.trim() || null,
          notes: notes.trim() || null
        })
        .select()
        .single();

      if (lockboxError) throw lockboxError;

      // 2. Create empty slots for this lockbox
      const slots = Array.from({ length: slotCount }, (_, i) => ({
        lockbox_id: lockbox.id,
        slot_number: i + 1,
        label: `Slot ${i + 1}`,
        status: 'in_box' as const
      }));

      const { error: slotsError } = await supabase
        .from('lockbox_slots')
        .insert(slots);

      if (slotsError) throw slotsError;

      toast.success(`Lockbox "${name}" created with ${slotCount} slots`);
      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setName("");
      setLocation("");
      setSlotCount(10);
      setNotes("");
    } catch (error) {
      logger.error('Error creating lockbox:', error);
      toast.error(getErrorMessage(error) || "Failed to create lockbox");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Lockbox</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Lockbox Name <span className="text-destructive">*</span></Label>
            <Input 
              placeholder="e.g. Security Office Lockbox" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              disabled={isCreating}
            />
          </div>

          <div className="space-y-2">
            <Label>Location / Room</Label>
            <Input 
              placeholder="e.g. 17th Floor - Room 1701" 
              value={location} 
              onChange={(e) => setLocation(e.target.value)}
              disabled={isCreating}
            />
          </div>

          <div className="space-y-2">
            <Label>Number of Slots</Label>
            <Input 
              type="number" 
              min={1} 
              max={50}
              value={slotCount} 
              onChange={(e) => setSlotCount(Math.max(1, parseInt(e.target.value) || 1))}
              disabled={isCreating}
            />
            <p className="text-xs text-muted-foreground">
              Default slots will be created (you can customize them later)
            </p>
          </div>

          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea 
              placeholder="Any additional information..." 
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
            Create Lockbox
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
