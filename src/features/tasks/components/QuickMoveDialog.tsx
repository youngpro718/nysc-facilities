/**
 * QuickMoveDialog Component
 *
 * One-button "Move" flow: pick what's moving (file cabinet / desk / boxes),
 * answer the two or three questions that actually matter, done. The dialog
 * bakes in the ground rules so requesters can't skip them — cabinets must be
 * confirmed empty, boxes must be packed/labeled with a count, desks need a
 * type — instead of relying on staff to chase those details afterwards.
 *
 * Everything lands in the shared task bin: admins create pre-approved
 * unassigned tasks that aides can claim; everyone else submits a request into
 * the same queue. Nobody assigns individuals from here — that stays with
 * admins on the task itself.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ArrowRight, Loader2, Truck, Archive, Box, Package } from 'lucide-react';
import {
  Dialog,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { ModalFrame } from '@shared/components/common/common/ModalFrame';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useStaffTasks } from '@features/tasks/hooks/useStaffTasks';
import { useRolePermissions } from '@features/auth/hooks/useRolePermissions';
import { LIMITS } from '@/config';

type MoveKind = 'file_cabinet' | 'desk' | 'boxes';

const MOVE_KINDS: { value: MoveKind; label: string; icon: typeof Archive; requirement: string }[] = [
  {
    value: 'file_cabinet',
    label: 'File Cabinet',
    icon: Archive,
    requirement: 'Cabinets must be completely empty before staff will move them.',
  },
  {
    value: 'desk',
    label: 'Desk',
    icon: Package,
    requirement: 'Tell us what kind of desk so the right crew and equipment show up.',
  },
  {
    value: 'boxes',
    label: 'Boxes',
    icon: Box,
    requirement: 'Boxes must be packed, closed, and labeled — and we need an exact count.',
  },
];

const DESK_TYPES = ['L-shape', 'Regular', 'Large', 'Small'] as const;

const KIND_NOUNS: Record<MoveKind, { singular: string; plural: string }> = {
  file_cabinet: { singular: 'file cabinet', plural: 'file cabinets' },
  desk: { singular: 'desk', plural: 'desks' },
  boxes: { singular: 'box', plural: 'boxes' },
};

interface QuickMoveDialogProps {
  trigger?: React.ReactNode;
}

export function QuickMoveDialog({ trigger }: QuickMoveDialogProps) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<MoveKind | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [deskType, setDeskType] = useState<string>('');
  const [fromRoomId, setFromRoomId] = useState<string>('');
  const [toRoomId, setToRoomId] = useState<string>('');
  const [confirmedReady, setConfirmedReady] = useState(false);
  const [notes, setNotes] = useState('');

  const { createTask, requestTask } = useStaffTasks();
  const { isAdmin } = useRolePermissions();

  const { data: rooms = [] } = useQuery({
    queryKey: ['rooms-select'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select('id, room_number, name')
        .order('room_number')
        .limit(LIMITS.roomsDropdown);
      if (error) throw error;
      return data || [];
    },
  });

  const reset = () => {
    setKind(null);
    setQuantity('1');
    setDeskType('');
    setFromRoomId('');
    setToRoomId('');
    setConfirmedReady(false);
    setNotes('');
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) reset();
  };

  const qty = Math.max(1, parseInt(quantity) || 0);
  const needsConfirmation = kind === 'file_cabinet' || kind === 'boxes';
  const selectedKind = MOVE_KINDS.find(k => k.value === kind);

  const canSubmit =
    !!kind &&
    qty >= 1 &&
    !!toRoomId &&
    (kind !== 'desk' || !!deskType) &&
    (!needsConfirmation || confirmedReady);

  const isSubmitting = createTask.isPending || requestTask.isPending;

  const roomLabel = (id: string) => {
    const room = rooms.find(r => r.id === id);
    return room ? room.room_number : '';
  };

  const handleSubmit = async () => {
    if (!kind || !canSubmit) return;

    const noun = qty === 1 ? KIND_NOUNS[kind].singular : KIND_NOUNS[kind].plural;
    const what = kind === 'desk' && deskType ? `${deskType} ${noun}` : noun;
    const route = `${fromRoomId ? `Rm ${roomLabel(fromRoomId)}` : '—'} → Rm ${roomLabel(toRoomId)}`;
    const title = `Move ${qty} ${what}: ${route}`;

    const detailLines = [
      `What: ${qty} × ${what}`,
      fromRoomId ? `From: Room ${roomLabel(fromRoomId)}` : null,
      `To: Room ${roomLabel(toRoomId)}`,
      kind === 'file_cabinet' ? 'Requester confirmed: cabinets are EMPTY.' : null,
      kind === 'boxes' ? `Requester confirmed: boxes are packed, closed, and labeled. Count: ${qty}.` : null,
      notes.trim() ? `Notes: ${notes.trim()}` : null,
    ].filter(Boolean);

    const payload = {
      title,
      description: detailLines.join('\n'),
      task_type: 'move_item' as const,
      from_room_id: fromRoomId || undefined,
      to_room_id: toRoomId,
      quantity: qty,
    };

    // Admins drop a pre-approved, unassigned task straight into the bin for
    // aides to claim; everyone else files a request into the same queue.
    if (isAdmin) {
      await createTask.mutateAsync({ ...payload, priority: 'medium' });
    } else {
      await requestTask.mutateAsync(payload);
    }
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Truck className="h-4 w-4 mr-2" />
            Move
          </Button>
        )}
      </DialogTrigger>
      <ModalFrame
        title="Quick Move"
        description="What needs to be moved?"
        size="sm"
      >
        <div className="space-y-4">
          {/* What's moving */}
          <div className="grid grid-cols-3 gap-2">
            {MOVE_KINDS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setKind(value);
                  setConfirmedReady(false);
                }}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-lg border p-3 text-sm font-medium transition-colors',
                  kind === value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'hover:bg-accent/50',
                )}
              >
                <Icon className="h-5 w-5" />
                {label}
              </button>
            ))}
          </div>

          {selectedKind && (
            <>
              <p className="text-xs text-muted-foreground">{selectedKind.requirement}</p>

              {kind === 'desk' && (
                <div className="space-y-2">
                  <Label htmlFor="qm-desk-type">What kind of desk? *</Label>
                  <Select value={deskType} onValueChange={setDeskType}>
                    <SelectTrigger id="qm-desk-type" aria-label="Desk type">
                      <SelectValue placeholder="Pick the desk type" />
                    </SelectTrigger>
                    <SelectContent>
                      {DESK_TYPES.map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="qm-quantity">
                  How many{kind === 'boxes' ? ' boxes (exact count)' : ''}? *
                </Label>
                <Input
                  id="qm-quantity"
                  type="number"
                  min={1}
                  className="max-w-[120px]"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                <div className="space-y-2">
                  <Label htmlFor="qm-from">From room</Label>
                  <Select
                    value={fromRoomId || '__none__'}
                    onValueChange={(v) => setFromRoomId(v === '__none__' ? '' : v)}
                  >
                    <SelectTrigger id="qm-from" aria-label="From room">
                      <SelectValue placeholder="Not specified" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Not specified</SelectItem>
                      {rooms.map(room => (
                        <SelectItem key={room.id} value={room.id}>
                          {room.room_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qm-to" className="flex items-center gap-1">
                    <ArrowRight className="h-3 w-3" />
                    To room *
                  </Label>
                  <Select
                    value={toRoomId || '__none__'}
                    onValueChange={(v) => setToRoomId(v === '__none__' ? '' : v)}
                  >
                    <SelectTrigger id="qm-to" aria-label="To room">
                      <SelectValue placeholder="Select room" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Select room</SelectItem>
                      {rooms.map(room => (
                        <SelectItem key={room.id} value={room.id}>
                          {room.room_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {needsConfirmation && (
                <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3">
                  <Checkbox
                    id="qm-confirm"
                    checked={confirmedReady}
                    onCheckedChange={(checked) => setConfirmedReady(checked === true)}
                    className="mt-0.5"
                  />
                  <Label htmlFor="qm-confirm" className="cursor-pointer text-sm font-normal leading-snug">
                    {kind === 'file_cabinet'
                      ? 'I confirm the file cabinet(s) are completely empty.'
                      : 'I confirm the boxes are packed, closed, and labeled, and the count above is exact.'}
                  </Label>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="qm-notes">Anything else? <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Textarea
                  id="qm-notes"
                  rows={2}
                  placeholder="e.g., Heavy items on top, needs to happen before Thursday…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {isAdmin ? 'Create Move Task' : 'Submit Move Request'}
          </Button>
        </DialogFooter>
      </ModalFrame>
    </Dialog>
  );
}
