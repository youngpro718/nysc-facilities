/**
 * QuickTaskDialog Component
 *
 * The porter-work fast lane. One button covers the four things the court
 * aides actually get asked to do all day:
 *
 *   Move          — boxes, files, a desk, a file cabinet, from here to there
 *   Remove        — haul a cabinet/bookshelf/desk/books out of a room; the
 *                   crew assesses it (reusable furniture goes back to one of
 *                   our storage rooms, real garbage is staged for DCAS)
 *   Delivery run  — take a file/package somewhere, including other
 *                   courthouses (60 Centre etc. — free-text destination)
 *   From storage  — bring a desk / file cabinet / chair out of storage to a
 *                   room
 *
 * Each action asks only the questions that matter and refuses to submit
 * until the ground rules are confirmed: cabinets empty, bookshelves cleared,
 * boxes packed & counted, desks typed. A Today / Tomorrow / This week pick
 * sets the due date without a date picker.
 *
 * Everything lands in the shared task pool: admins create pre-approved
 * unassigned tasks aides can claim; everyone else files a request into the
 * same queue. Assigning individuals stays with admins on the task itself.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  ArrowRight,
  Loader2,
  Truck,
  Archive,
  Box,
  Package,
  Trash2,
  Send,
  Warehouse,
  BookOpen,
  Armchair,
  FileText,
  MoveRight,
  HelpCircle,
} from 'lucide-react';
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
import type { TaskType, TaskPriority } from '@features/tasks/types/staffTasks';
import { LIMITS } from '@/config';

// ── What kind of job ────────────────────────────────────────────────────────

type QuickAction = 'move' | 'remove' | 'run' | 'from_storage';

const ACTIONS: { value: QuickAction; label: string; icon: typeof Truck; blurb: string }[] = [
  { value: 'move', label: 'Move', icon: MoveRight, blurb: 'From one room to another' },
  { value: 'remove', label: 'Remove', icon: Trash2, blurb: 'Haul it out of a room' },
  { value: 'run', label: 'Delivery Run', icon: Send, blurb: 'Take something somewhere' },
  { value: 'from_storage', label: 'From Storage', icon: Warehouse, blurb: 'Bring an item to a room' },
];

// ── What kind of item, per action ───────────────────────────────────────────

type ItemKind =
  | 'file_cabinet'
  | 'desk'
  | 'boxes'
  | 'files'
  | 'bookshelf'
  | 'books'
  | 'chair'
  | 'other';

const KIND_META: Record<ItemKind, { label: string; icon: typeof Archive; singular: string; plural: string }> = {
  file_cabinet: { label: 'File Cabinet', icon: Archive, singular: 'file cabinet', plural: 'file cabinets' },
  desk: { label: 'Desk', icon: Package, singular: 'desk', plural: 'desks' },
  boxes: { label: 'Boxes', icon: Box, singular: 'box', plural: 'boxes' },
  files: { label: 'Files', icon: FileText, singular: 'file', plural: 'files' },
  bookshelf: { label: 'Bookshelf', icon: BookOpen, singular: 'bookshelf', plural: 'bookshelves' },
  books: { label: 'Books', icon: BookOpen, singular: 'book', plural: 'books' },
  chair: { label: 'Chair', icon: Armchair, singular: 'chair', plural: 'chairs' },
  other: { label: 'Other', icon: HelpCircle, singular: 'item', plural: 'items' },
};

const KINDS_BY_ACTION: Record<Exclude<QuickAction, 'run'>, ItemKind[]> = {
  move: ['file_cabinet', 'desk', 'boxes', 'files', 'other'],
  remove: ['file_cabinet', 'desk', 'bookshelf', 'books', 'other'],
  from_storage: ['file_cabinet', 'desk', 'chair', 'bookshelf', 'other'],
};

const DESK_TYPES = ['L-shape', 'Regular', 'Large', 'Small'] as const;

// ── When it's needed ────────────────────────────────────────────────────────

type NeededBy = 'none' | 'today' | 'tomorrow' | 'this_week';

const NEEDED_BY_OPTIONS: { value: NeededBy; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'tomorrow', label: 'Tomorrow' },
  { value: 'this_week', label: 'This week' },
  { value: 'none', label: 'No rush' },
];

function neededByToDueDate(neededBy: NeededBy): string | undefined {
  if (neededBy === 'none') return undefined;
  const due = new Date();
  if (neededBy === 'tomorrow') due.setDate(due.getDate() + 1);
  if (neededBy === 'this_week') due.setDate(due.getDate() + 5);
  due.setHours(17, 0, 0, 0);
  // "Today" after 5pm still means today — push to end of day instead of the past.
  if (due.getTime() < Date.now()) due.setHours(23, 59, 0, 0);
  return due.toISOString();
}

// ── Component ───────────────────────────────────────────────────────────────

interface QuickTaskDialogProps {
  trigger?: React.ReactNode;
}

export function QuickTaskDialog({ trigger }: QuickTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState<QuickAction | null>(null);
  const [kind, setKind] = useState<ItemKind | null>(null);
  const [otherWhat, setOtherWhat] = useState('');
  const [runWhat, setRunWhat] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [deskType, setDeskType] = useState<string>('');
  const [fromRoomId, setFromRoomId] = useState<string>('');
  const [toRoomId, setToRoomId] = useState<string>('');
  const [otherDestination, setOtherDestination] = useState('');
  const [useOtherDestination, setUseOtherDestination] = useState(false);
  const [confirmedReady, setConfirmedReady] = useState(false);
  const [neededBy, setNeededBy] = useState<NeededBy>('none');
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
    setAction(null);
    setKind(null);
    setOtherWhat('');
    setRunWhat('');
    setQuantity('1');
    setDeskType('');
    setFromRoomId('');
    setToRoomId('');
    setOtherDestination('');
    setUseOtherDestination(false);
    setConfirmedReady(false);
    setNeededBy('none');
    setNotes('');
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) reset();
  };

  const pickAction = (next: QuickAction) => {
    setAction(next);
    setKind(null);
    setConfirmedReady(false);
    setUseOtherDestination(false);
  };

  const qty = Math.max(1, parseInt(quantity) || 0);
  const roomLabel = (id: string) => rooms.find(r => r.id === id)?.room_number ?? '';

  // Ground-rule confirmation, when one applies to this action + item.
  const confirmationText = (() => {
    if (!action || !kind) return null;
    if (kind === 'file_cabinet' && (action === 'move' || action === 'remove')) {
      return 'I confirm the file cabinet(s) are completely empty.';
    }
    if (kind === 'bookshelf' && action === 'remove') {
      return 'I confirm the bookshelf/bookshelves are cleared off.';
    }
    if (kind === 'boxes' && action === 'move') {
      return 'I confirm the boxes are packed, closed, and labeled, and the count above is exact.';
    }
    if (kind === 'books' && action === 'remove') {
      return 'I confirm the books are boxed or stacked and ready to go, and the count is accurate.';
    }
    return null;
  })();

  const needsDeskType = kind === 'desk';
  const needsFrom = action === 'remove'; // where to remove FROM is the whole job
  const needsTo = action === 'move' || action === 'from_storage';
  const runDestinationOk =
    action !== 'run' || (useOtherDestination ? otherDestination.trim().length > 0 : !!toRoomId);

  const canSubmit =
    !!action &&
    (action === 'run'
      ? runWhat.trim().length > 0 && runDestinationOk
      : !!kind &&
        qty >= 1 &&
        (kind !== 'other' || otherWhat.trim().length > 0) &&
        (!needsDeskType || !!deskType) &&
        (!needsFrom || !!fromRoomId) &&
        (!needsTo || !!toRoomId) &&
        (!confirmationText || confirmedReady));

  const isSubmitting = createTask.isPending || requestTask.isPending;

  const handleSubmit = async () => {
    if (!action || !canSubmit) return;

    let title = '';
    const detailLines: (string | null)[] = [];
    let taskType: TaskType = 'general';

    const destinationText = useOtherDestination
      ? otherDestination.trim()
      : toRoomId
        ? `Rm ${roomLabel(toRoomId)}`
        : '';

    if (action === 'run') {
      taskType = 'delivery';
      title = `Delivery run: ${runWhat.trim()} → ${destinationText}`;
      detailLines.push(
        `Deliver: ${runWhat.trim()}`,
        fromRoomId ? `Pick up from: Room ${roomLabel(fromRoomId)}` : null,
        `Deliver to: ${destinationText}`,
      );
    } else {
      const meta = KIND_META[kind!];
      const noun = qty === 1 ? meta.singular : meta.plural;
      const what =
        kind === 'other'
          ? otherWhat.trim()
          : kind === 'desk' && deskType
            ? `${deskType} ${noun}`
            : noun;

      if (action === 'move') {
        taskType = 'move_item';
        title = `Move ${qty} ${what}: ${fromRoomId ? `Rm ${roomLabel(fromRoomId)}` : '—'} → Rm ${roomLabel(toRoomId)}`;
        detailLines.push(
          `What: ${qty} × ${what}`,
          fromRoomId ? `From: Room ${roomLabel(fromRoomId)}` : null,
          `To: Room ${roomLabel(toRoomId)}`,
        );
      } else if (action === 'remove') {
        taskType = 'pickup';
        title = `Remove ${qty} ${what} from Rm ${roomLabel(fromRoomId)}`;
        detailLines.push(
          `What: ${qty} × ${what}`,
          `Remove from: Room ${roomLabel(fromRoomId)}`,
          'Assess on pickup: reusable furniture goes back to one of our storage rooms; actual junk gets staged for DCAS disposal — we do not trash usable stock.',
        );
      } else {
        taskType = 'delivery';
        title = `From storage: ${qty} ${what} to Rm ${roomLabel(toRoomId)}`;
        detailLines.push(
          `What: ${qty} × ${what} (pull from a storage room)`,
          `Deliver to: Room ${roomLabel(toRoomId)}`,
        );
      }

      if (confirmationText && confirmedReady) {
        detailLines.push(`Requester confirmed: ${confirmationText.replace(/^I confirm /, '')}`);
      }
    }

    if (neededBy !== 'none') {
      detailLines.push(`Needed: ${NEEDED_BY_OPTIONS.find(o => o.value === neededBy)?.label}`);
    }
    if (notes.trim()) detailLines.push(`Notes: ${notes.trim()}`);

    const priority: TaskPriority = neededBy === 'today' ? 'high' : 'medium';

    const payload = {
      title,
      description: detailLines.filter(Boolean).join('\n'),
      task_type: taskType,
      from_room_id: fromRoomId || undefined,
      to_room_id: !useOtherDestination && toRoomId ? toRoomId : undefined,
      quantity: action === 'run' ? 1 : qty,
      due_date: neededByToDueDate(neededBy),
    };

    // Admins drop a pre-approved, unassigned task straight into the pool for
    // aides to claim; everyone else files a request into the same queue.
    if (isAdmin) {
      await createTask.mutateAsync({ ...payload, priority });
    } else {
      await requestTask.mutateAsync(payload);
    }
    handleOpenChange(false);
  };

  const kindsForAction = action && action !== 'run' ? KINDS_BY_ACTION[action] : [];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Truck className="h-4 w-4 mr-2" />
            Quick Task
          </Button>
        )}
      </DialogTrigger>
      <ModalFrame
        title="Quick Task"
        description="What do you need done?"
        size="sm"
      >
        <div className="space-y-4">
          {/* Which job */}
          <div className="grid grid-cols-2 gap-2">
            {ACTIONS.map(({ value, label, icon: Icon, blurb }) => (
              <button
                key={value}
                type="button"
                onClick={() => pickAction(value)}
                className={cn(
                  'flex flex-col items-start gap-0.5 rounded-lg border p-3 text-left transition-colors',
                  action === value
                    ? 'border-primary bg-primary/10'
                    : 'hover:bg-accent/50',
                )}
              >
                <span className={cn('flex items-center gap-1.5 text-sm font-medium', action === value && 'text-primary')}>
                  <Icon className="h-4 w-4" />
                  {label}
                </span>
                <span className="text-[11px] text-muted-foreground leading-tight">{blurb}</span>
              </button>
            ))}
          </div>

          {/* Item kind (all actions except delivery run) */}
          {action && action !== 'run' && (
            <div className="flex flex-wrap gap-2">
              {kindsForAction.map((k) => {
                const meta = KIND_META[k];
                const Icon = meta.icon;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => {
                      setKind(k);
                      setConfirmedReady(false);
                    }}
                    className={cn(
                      'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors',
                      kind === k
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'hover:bg-accent/50',
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {meta.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Delivery run: what + destination (rooms or anywhere, e.g. 60 Centre) */}
          {action === 'run' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="qt-run-what">What's being delivered? *</Label>
                <Input
                  id="qt-run-what"
                  placeholder="e.g., Court file for Part 62, sealed envelope…"
                  value={runWhat}
                  onChange={(e) => setRunWhat(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="qt-run-from">Pick up from</Label>
                  <Select
                    value={fromRoomId || '__none__'}
                    onValueChange={(v) => setFromRoomId(v === '__none__' ? '' : v)}
                  >
                    <SelectTrigger id="qt-run-from" aria-label="Pick up from room">
                      <SelectValue placeholder="Not specified" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Not specified</SelectItem>
                      {rooms.map(room => (
                        <SelectItem key={room.id} value={room.id}>{room.room_number}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qt-run-to" className="flex items-center gap-1">
                    <ArrowRight className="h-3 w-3" />
                    Deliver to *
                  </Label>
                  <Select
                    value={useOtherDestination ? '__other__' : toRoomId || '__none__'}
                    onValueChange={(v) => {
                      if (v === '__other__') {
                        setUseOtherDestination(true);
                        setToRoomId('');
                      } else {
                        setUseOtherDestination(false);
                        setToRoomId(v === '__none__' ? '' : v);
                      }
                    }}
                  >
                    <SelectTrigger id="qt-run-to" aria-label="Deliver to">
                      <SelectValue placeholder="Select destination" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Select destination</SelectItem>
                      <SelectItem value="__other__">Another building / address…</SelectItem>
                      {rooms.map(room => (
                        <SelectItem key={room.id} value={room.id}>{room.room_number}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {useOtherDestination && (
                <div className="space-y-2">
                  <Label htmlFor="qt-run-other">Where exactly? *</Label>
                  <Input
                    id="qt-run-other"
                    placeholder="e.g., 60 Centre Street, Rm 401"
                    value={otherDestination}
                    onChange={(e) => setOtherDestination(e.target.value)}
                  />
                </div>
              )}
            </>
          )}

          {/* Item-based actions: details */}
          {action && action !== 'run' && kind && (
            <>
              {kind === 'other' && (
                <div className="space-y-2">
                  <Label htmlFor="qt-other-what">What is it? *</Label>
                  <Input
                    id="qt-other-what"
                    placeholder="e.g., Podium, rolling cart, AC unit…"
                    value={otherWhat}
                    onChange={(e) => setOtherWhat(e.target.value)}
                  />
                </div>
              )}

              {needsDeskType && (
                <div className="space-y-2">
                  <Label htmlFor="qt-desk-type">What kind of desk? *</Label>
                  <Select value={deskType} onValueChange={setDeskType}>
                    <SelectTrigger id="qt-desk-type" aria-label="Desk type">
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

              <div className="grid grid-cols-[120px_1fr] gap-3 items-end">
                <div className="space-y-2">
                  <Label htmlFor="qt-quantity">How many? *</Label>
                  <Input
                    id="qt-quantity"
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>
                {(kind === 'boxes' || kind === 'books') && (
                  <p className="text-xs text-muted-foreground pb-2">
                    Exact count — the crew checks it against what they pick up.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(action === 'move' || action === 'remove') && (
                  <div className="space-y-2">
                    <Label htmlFor="qt-from">From room {needsFrom ? '*' : ''}</Label>
                    <Select
                      value={fromRoomId || '__none__'}
                      onValueChange={(v) => setFromRoomId(v === '__none__' ? '' : v)}
                    >
                      <SelectTrigger id="qt-from" aria-label="From room">
                        <SelectValue placeholder={needsFrom ? 'Select room' : 'Not specified'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">{needsFrom ? 'Select room' : 'Not specified'}</SelectItem>
                        {rooms.map(room => (
                          <SelectItem key={room.id} value={room.id}>{room.room_number}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {needsTo && (
                  <div className="space-y-2">
                    <Label htmlFor="qt-to" className="flex items-center gap-1">
                      <ArrowRight className="h-3 w-3" />
                      To room *
                    </Label>
                    <Select
                      value={toRoomId || '__none__'}
                      onValueChange={(v) => setToRoomId(v === '__none__' ? '' : v)}
                    >
                      <SelectTrigger id="qt-to" aria-label="To room">
                        <SelectValue placeholder="Select room" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Select room</SelectItem>
                        {rooms.map(room => (
                          <SelectItem key={room.id} value={room.id}>{room.room_number}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {action === 'remove' && (
                <p className="text-xs text-muted-foreground">
                  The crew assesses what they pick up — usable furniture goes back to a
                  storage room, junk gets staged for DCAS. It doesn't just get trashed.
                </p>
              )}

              {confirmationText && (
                <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3">
                  <Checkbox
                    id="qt-confirm"
                    checked={confirmedReady}
                    onCheckedChange={(checked) => setConfirmedReady(checked === true)}
                    className="mt-0.5"
                  />
                  <Label htmlFor="qt-confirm" className="cursor-pointer text-sm font-normal leading-snug">
                    {confirmationText}
                  </Label>
                </div>
              )}
            </>
          )}

          {/* When + notes — shown once a job is specified enough */}
          {action && (action === 'run' || kind) && (
            <>
              <div className="space-y-2">
                <Label>When is it needed?</Label>
                <div className="flex flex-wrap gap-2">
                  {NEEDED_BY_OPTIONS.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setNeededBy(value)}
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-sm transition-colors',
                        neededBy === value
                          ? 'border-primary bg-primary/10 text-primary font-medium'
                          : 'hover:bg-accent/50',
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="qt-notes">Anything else? <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Textarea
                  id="qt-notes"
                  rows={2}
                  placeholder="e.g., Heavy items on top, call ext. 1234 on arrival…"
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
            {isAdmin ? 'Create Task' : 'Submit Request'}
          </Button>
        </DialogFooter>
      </ModalFrame>
    </Dialog>
  );
}
