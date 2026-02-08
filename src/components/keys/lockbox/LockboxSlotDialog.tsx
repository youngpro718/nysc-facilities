import { useState } from "react";
import { getErrorMessage } from "@/lib/errorUtils";
import { logger } from '@/lib/logger';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LockboxSlot } from "../types/LockboxTypes";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Edit3 } from "lucide-react";
import { EditSlotDialog } from "./EditSlotDialog";

interface LockboxSlotDialogProps {
  slot: LockboxSlot | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  lockboxName?: string;
}

export function LockboxSlotDialog({ slot, open, onOpenChange, onSuccess, lockboxName }: LockboxSlotDialogProps) {
  const [personName, setPersonName] = useState("");
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  if (!slot) return null;

  const handleAction = async (newStatus: 'in_box' | 'checked_out' | 'missing') => {
    if (newStatus === 'checked_out' && !personName) {
      toast.error("Please enter the name of the person taking the key");
      return;
    }

    setIsLoading(true);
    try {
      // 1. Update Slot Status
      const { error: updateError } = await supabase
        .from('lockbox_slots')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', slot.id);

      if (updateError) throw updateError;

      // 2. Log Activity
      const { data: { user } } = await supabase.auth.getUser();
      const actionMap = {
        'in_box': 'check_in',
        'checked_out': 'check_out',
        'missing': 'status_change'
      };

      const { error: logError } = await supabase
        .from('lockbox_activity_logs')
        .insert({
          slot_id: slot.id,
          action: actionMap[newStatus as keyof typeof actionMap] || 'status_change',
          status_before: slot.status,
          status_after: newStatus,
          actor_user_id: user?.id,
          actor_name: personName || (user?.email), 
          note: note
        });

      if (logError) throw logError;

      toast.success(`Key ${newStatus === 'in_box' ? 'returned' : 'checked out'} successfully`);
      onSuccess();
      onOpenChange(false);
      setPersonName("");
      setNote("");
    } catch (error) {
      logger.error('Error updating key status:', error);
      toast.error(getErrorMessage(error) || "Failed to update status");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  Slot {slot.slot_number}: {slot.label}
                </DialogTitle>
                {lockboxName && (
                  <p className="text-sm text-muted-foreground">
                    Lockbox: {lockboxName}
                  </p>
                )}
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => {
                  setEditDialogOpen(true);
                  onOpenChange(false);
                }}
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="bg-muted p-3 rounded-md text-sm space-y-1">
            <div>
              <span className="font-semibold">Current Status: </span>
              <span className="uppercase">{slot.status.replace('_', ' ')}</span>
            </div>
            <div>
              <span className="font-semibold">Quantity: </span>
              <span>{slot.quantity || 1} {slot.quantity === 1 ? 'key' : 'keys'}</span>
            </div>
          </div>

          {slot.status === 'in_box' && (
            <div className="space-y-2">
              <Label>Person Taking Key <span className="text-red-500">*</span></Label>
              <Input 
                placeholder="e.g. Officer Smith, Plumber..." 
                value={personName} 
                onChange={(e) => setPersonName(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea 
              placeholder="Any additional details..." 
              value={note} 
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {slot.status === 'in_box' ? (
            <Button 
              className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600" 
              onClick={() => handleAction('checked_out')}
              disabled={isLoading}
            >
              Check Out
            </Button>
          ) : (
            <Button 
              className="w-full sm:w-auto bg-green-500 hover:bg-green-600" 
              onClick={() => handleAction('in_box')}
              disabled={isLoading}
            >
              Check In (Return)
            </Button>
          )}
          
          <Button 
            variant="outline" 
            className="w-full sm:w-auto border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 dark:bg-red-950/30"
            onClick={() => handleAction('missing')}
            disabled={isLoading}
          >
            Mark Missing
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <EditSlotDialog 
      slot={slot}
      open={editDialogOpen}
      onOpenChange={(open) => {
        setEditDialogOpen(open);
        if (!open) onOpenChange(true);
      }}
      onSuccess={onSuccess}
    />
    </>
  );
}
