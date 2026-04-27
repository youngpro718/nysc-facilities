import { useState } from "react";
import { getErrorMessage } from "@/lib/errorUtils";
import { logger } from '@/lib/logger';
import { ModalFrame } from "@shared/components/common/common/ModalFrame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LockboxSlot } from "../types/LockboxTypes";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Edit3, MoreHorizontal } from "lucide-react";
import { EditSlotDialog } from "./EditSlotDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LockboxSlotDialogProps {
  slot: LockboxSlot | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  lockboxName?: string;
}

function getHumanStatus(status: string) {
  switch (status) {
    case 'in_box': return 'Available';
    case 'checked_out': return 'Checked Out';
    case 'missing': return 'Missing';
    case 'retired': return 'Retired';
    default: return status;
  }
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
      const { error: updateError } = await supabase
        .from('lockbox_slots')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', slot.id);

      if (updateError) throw updateError;

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

      toast.success(`Key ${newStatus === 'in_box' ? 'returned' : newStatus === 'checked_out' ? 'checked out' : 'marked missing'} successfully`);
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

  const headerRight = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => {
          setEditDialogOpen(true);
          onOpenChange(false);
        }}>
          <Edit3 className="h-4 w-4 mr-2" />
          Edit Slot
        </DropdownMenuItem>
        {slot.status !== 'missing' && (
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => handleAction('missing')}
          >
            Mark Missing
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      <ModalFrame
        open={open}
        onOpenChange={onOpenChange}
        size="sm"
        title={`Slot ${slot.slot_number}: ${slot.label}`}
        description={lockboxName ? `Lockbox: ${lockboxName}` : undefined}
        headerRight={headerRight}
      >
        <div className="space-y-4">
          <div className="bg-muted p-3 rounded-md text-sm space-y-1">
            <div>
              <span className="font-semibold">Status: </span>
              <span>{getHumanStatus(slot.status)}</span>
            </div>
            <div>
              <span className="font-semibold">Quantity: </span>
              <span>{slot.quantity || 1} {(slot.quantity || 1) === 1 ? 'key' : 'keys'}</span>
            </div>
          </div>

          {slot.status === 'in_box' && (
            <div className="space-y-2">
              <Label>Person Taking Key <span className="text-destructive">*</span></Label>
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

          <div className="flex flex-col sm:flex-row gap-2 justify-end pt-2">
            {slot.status === 'in_box' ? (
              <Button
                className="w-full sm:w-auto"
                onClick={() => handleAction('checked_out')}
                disabled={isLoading}
              >
                Check Out Key
              </Button>
            ) : (
              <Button
                className="w-full sm:w-auto"
                onClick={() => handleAction('in_box')}
                disabled={isLoading}
              >
                {slot.status === 'missing' ? 'Found — Return Key' : 'Return Key'}
              </Button>
            )}
          </div>
        </div>
      </ModalFrame>

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
