import { useState } from "react";
import { getErrorMessage } from "@/lib/errorUtils";
import { logger } from '@/lib/logger';
import { ModalFrame } from "@shared/components/common/common/ModalFrame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  LockboxSlot,
  getKeyRoleLabel,
  getSlotBuildingLocation,
  getSlotCompactTitle,
  getSlotDisplayTitle,
} from "../types/LockboxTypes";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Edit3, MoreHorizontal, Trash2 } from "lucide-react";
import { EditSlotDialog } from "./EditSlotDialog";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
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
  const [actionsOpen, setActionsOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDelete = async () => {
    if (!slot) return;
    setIsDeleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Log deletion before deleting (cascade would remove logs otherwise)
      const { error: logError } = await supabase
        .from('lockbox_activity_logs')
        .insert({
          slot_id: slot.id,
          action: 'delete',
          status_before: slot.status,
          status_after: 'deleted',
          actor_user_id: user?.id,
          actor_name: user?.email,
          note: `Slot "${slot.label}" deleted from lockbox`,
        });

      if (logError) logger.error('Error logging slot deletion:', logError);

      const { error: deleteError } = await supabase
        .from('lockbox_slots')
        .delete()
        .eq('id', slot.id);

      if (deleteError) throw deleteError;

      toast.success("Slot deleted successfully");
      onSuccess();
      onOpenChange(false);
      setDeleteConfirmOpen(false);
    } catch (error) {
      logger.error('Error deleting slot:', error);
      toast.error(getErrorMessage(error) || "Failed to delete slot");
    } finally {
      setIsDeleting(false);
    }
  };

  const headerRight = (
    <DropdownMenu open={actionsOpen} onOpenChange={setActionsOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Slot actions"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        disablePortal
        className="z-[120] w-44"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            setActionsOpen(false);
            setEditDialogOpen(true);
          }}
        >
          <Edit3 className="h-4 w-4 mr-2" />
          Edit Slot
        </DropdownMenuItem>
        {slot.status !== 'missing' && (
          <DropdownMenuItem
            className="text-destructive"
            onSelect={() => {
              setActionsOpen(false);
              handleAction('missing');
            }}
          >
            Mark Missing
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          className="text-destructive"
          onSelect={() => {
            setActionsOpen(false);
            setDeleteConfirmOpen(true);
          }}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Slot
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      <ModalFrame
        open={open}
        onOpenChange={onOpenChange}
        size="sm"
        title={`Slot ${slot.slot_number}: ${getSlotCompactTitle(slot)}`}
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
            {/* Which key this is — several slots can share a room (back
                office, safe, closet…), so surface the label/role here
                instead of making people open Edit to find out. Skipped when
                the header already says the same thing. */}
            {(() => {
              const norm = (s: string) => s.replace(/[^a-z0-9]/gi, "").toLowerCase();
              const label = slot.label?.trim();
              return label &&
                norm(label) !== norm(getSlotCompactTitle(slot)) &&
                norm(label) !== norm(getSlotDisplayTitle(slot)) ? (
                <div>
                  <span className="font-semibold">Key: </span>
                  <span>{label}</span>
                </div>
              ) : null;
            })()}
            {getKeyRoleLabel(slot.key_role, slot.sub_room_label) && (
              <div>
                <span className="font-semibold">Type: </span>
                <span>{getKeyRoleLabel(slot.key_role, slot.sub_room_label)}</span>
              </div>
            )}
            {/* Full "where is this room" info lives here, deliberately not on
                the list rows — those stay minimal (room number · descriptor). */}
            {slot.room?.name?.trim() && (
              <div>
                <span className="font-semibold">Room: </span>
                <span>{slot.room.name.trim()}</span>
              </div>
            )}
            {getSlotBuildingLocation(slot) && (
              <div>
                <span className="font-semibold">Location: </span>
                <span>{getSlotBuildingLocation(slot)}</span>
              </div>
            )}
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
        onOpenChange={setEditDialogOpen}
        onSuccess={onSuccess}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Slot"
        description={`Are you sure you want to delete Slot ${slot.slot_number}: "${getSlotDisplayTitle(slot)}"? This action cannot be undone and will remove all associated activity history.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </>
  );
}
