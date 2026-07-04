import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, X, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@shared/hooks/use-toast';
import { useCourtPersonnel } from '@features/court/hooks/useCourtPersonnel';
import { parseSittingDays, SITTING_DAY_ORDER } from '@features/court/utils/termPattern';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export interface EditableAssignment {
  id: string;
  part: string;
  justice: string;
  room: string;
  room_id: string;
  tel: string;
  fax: string;
  sergeant: string;
  clerks: string[];
  calendar_day: string | null;
}

interface Props {
  assignment: EditableAssignment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** roomId → part label for rooms already on the current term's sheet */
  takenRooms?: Map<string, string>;
}

const NONE = '__none__';

export const AssignmentEditDialog: React.FC<Props> = ({ assignment, open, onOpenChange, takenRooms }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { personnel } = useCourtPersonnel();

  const [part, setPart] = useState('');
  const [justice, setJustice] = useState<string>(NONE);
  const [sergeant, setSergeant] = useState<string>(NONE);
  const [clerks, setClerks] = useState<string[]>([]);
  const [tel, setTel] = useState('');
  const [fax, setFax] = useState('');
  const [clerkToAdd, setClerkToAdd] = useState<string>(NONE);
  const [roomId, setRoomId] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmShare, setConfirmShare] = useState(false);
  const [sittingDays, setSittingDays] = useState<string[]>([]);

  // Part being moved into a courtroom another part already uses → warn-but-allow.
  const sharedWith = roomId && roomId !== assignment?.room_id
    ? takenRooms?.get(roomId)?.replace(/\s+/g, ' ').trim()
    : undefined;
  const handleSave = () => {
    if (sharedWith && sharedWith !== '—') setConfirmShare(true);
    else saveMutation.mutate();
  };

  useEffect(() => {
    if (!assignment) return;
    setPart(assignment.part === '—' ? '' : assignment.part);
    setJustice(assignment.justice === '—' ? NONE : assignment.justice);
    setSergeant(assignment.sergeant === '—' ? NONE : assignment.sergeant);
    setClerks(assignment.clerks.filter(c => c && c !== '—'));
    setTel(assignment.tel === '—' ? '' : assignment.tel);
    setFax(assignment.fax === '—' ? '' : assignment.fax);
    setClerkToAdd(NONE);
    setRoomId(assignment.room_id);
    setConfirmDelete(false);
    setSittingDays(parseSittingDays(assignment.calendar_day));
  }, [assignment]);

  const toggleSittingDay = (day: string) =>
    setSittingDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);

  // Active courtrooms (shared cache with the board's Add Part picker)
  const { data: courtroomOptions = [] } = useQuery({
    queryKey: ['active-courtrooms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('court_rooms')
        .select('room_id, room_number, courtroom_number, is_active, rooms:room_id(room_number, name)')
        .eq('is_active', true);
      if (error) throw error;
      return (data || [])
        .map((r: any) => ({
          roomId: r.room_id as string,
          label: `Room ${r.rooms?.room_number || r.room_number || r.courtroom_number || '?'}${r.rooms?.name ? ` — ${r.rooms.name}` : ''}`,
        }))
        .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
    },
    staleTime: 1000 * 60 * 5,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!assignment) throw new Error('No assignment');
      const newJustice = justice === NONE ? null : justice;
      const newSergeant = sergeant === NONE ? null : sergeant;
      const newPart = part.trim() || null;
      const roomChanged = !!roomId && roomId !== assignment.room_id;

      // A "move" = a change to the people/part/room, not tel/fax/sitting-days.
      // Only these bump roster_changed_at so the board highlight (and its fade)
      // reflect real reassignments, never a phone-number tweak or a reorder.
      const origClerks = assignment.clerks.filter(c => c && c !== '—');
      const clerksChanged =
        clerks.length !== origClerks.length || clerks.some((c, i) => c !== origClerks[i]);
      const rosterChanged =
        newPart !== (assignment.part === '—' ? null : assignment.part) ||
        newJustice !== (assignment.justice === '—' ? null : assignment.justice) ||
        newSergeant !== (assignment.sergeant === '—' ? null : assignment.sergeant) ||
        clerksChanged ||
        roomChanged;

      const payload = {
        part: newPart,
        justice: newJustice,
        sergeant: newSergeant,
        clerks: clerks.length ? clerks : null,
        tel: tel.trim() || null,
        fax: fax.trim() || null,
        // Stored weekday-ordered ("Tuesday,Thursday"); null = sits every day
        calendar_day: sittingDays.length
          ? SITTING_DAY_ORDER.filter(d => sittingDays.includes(d)).join(',')
          : null,
        ...(roomChanged ? { room_id: roomId } : {}),
        ...(rosterChanged ? { roster_changed_at: new Date().toISOString() } : {}),
      };
      const { error } = await supabase
        .from('court_assignments')
        .update(payload)
        .eq('id', assignment.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Assignment updated' });
      queryClient.invalidateQueries({ queryKey: ['court-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['term-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['term-sheet-board'] });
      queryClient.invalidateQueries({ queryKey: ['court-assignments-enhanced'] });
      queryClient.invalidateQueries({ queryKey: ['court-assignments-table'] });
      queryClient.invalidateQueries({ queryKey: ['court-issues-integration'] });
      onOpenChange(false);
    },
    onError: (e: any) => {
      toast({ title: 'Update failed', description: e?.message ?? 'Please try again', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!assignment) throw new Error('No assignment');
      const { data, error } = await supabase
        .from('court_assignments')
        .delete()
        .eq('id', assignment.id)
        .select('id');
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("You don't have permission to remove parts");
      }
    },
    onSuccess: () => {
      toast({ title: 'Part removed from this term' });
      queryClient.invalidateQueries({ queryKey: ['term-sheet-board'] });
      queryClient.invalidateQueries({ queryKey: ['court-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['court-assignments-enhanced'] });
      queryClient.invalidateQueries({ queryKey: ['court-assignments-table'] });
      setConfirmDelete(false);
      onOpenChange(false);
    },
    onError: (e: any) => {
      setConfirmDelete(false);
      toast({ title: 'Could not remove part', description: e?.message ?? 'Please try again', variant: 'destructive' });
    },
  });

  const addClerk = () => {
    if (clerkToAdd === NONE) return;
    if (clerks.includes(clerkToAdd)) return;
    setClerks(prev => [...prev, clerkToAdd]);
    setClerkToAdd(NONE);
  };

  const removeClerk = (name: string) => setClerks(prev => prev.filter(c => c !== name));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Assignment {assignment?.part ? `· ${assignment.part}` : ''}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Part</Label>
              <Input value={part} onChange={e => setPart(e.target.value)} placeholder="e.g. Part 50" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Room</Label>
              <Select value={roomId} onValueChange={setRoomId}>
                <SelectTrigger><SelectValue placeholder={assignment?.room ? `Room ${assignment.room}` : 'Select room'} /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {courtroomOptions.map(o => {
                    // Room sharing is allowed (a courtroom can serve more than
                    // one part in a term) — just say who else uses it, don't block.
                    const usedBy = (o.roomId !== assignment?.room_id ? takenRooms?.get(o.roomId) : undefined)
                      ?.replace(/\s+/g, ' ').trim();
                    return (
                      <SelectItem key={o.roomId} value={o.roomId}>
                        {o.label}{usedBy && usedBy !== '—' ? ` · also used by ${usedBy}` : ''}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Justice</Label>
            <Select value={justice} onValueChange={setJustice}>
              <SelectTrigger><SelectValue placeholder="Select justice" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>— Vacant —</SelectItem>
                {personnel.judges.map(j => (
                  <SelectItem key={j.id} value={j.name}>{j.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Sergeant</Label>
            <Select value={sergeant} onValueChange={setSergeant}>
              <SelectTrigger><SelectValue placeholder="Select sergeant" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>— None —</SelectItem>
                {personnel.sergeants.map(s => (
                  <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Clerks</Label>
            <div className="flex flex-wrap gap-1.5 min-h-[28px]">
              {clerks.length === 0 && <span className="text-xs text-muted-foreground italic">No clerks assigned</span>}
              {clerks.map(name => (
                <Badge key={name} variant="secondary" className="gap-1 pr-1">
                  {name}
                  <button type="button" onClick={() => removeClerk(name)} className="hover:bg-muted-foreground/20 rounded p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <Select value={clerkToAdd} onValueChange={setClerkToAdd}>
                <SelectTrigger className="flex-1"><SelectValue placeholder="Add clerk…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>— Select clerk —</SelectItem>
                  {personnel.clerks
                    .filter(c => !clerks.includes(c.name))
                    .map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" size="sm" onClick={addClerk} disabled={clerkToAdd === NONE}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Add
              </Button>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Sitting days</Label>
            <div className="flex gap-1.5">
              {SITTING_DAY_ORDER.map(day => (
                <Button
                  key={day}
                  type="button"
                  variant={sittingDays.includes(day) ? 'default' : 'outline'}
                  size="sm"
                  className="h-7 px-2 text-xs flex-1"
                  onClick={() => toggleSittingDay(day)}
                >
                  {day.slice(0, 3)}
                </Button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground">
              Leave all unselected for parts that sit every court day.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Tel</Label>
              <Input value={tel} onChange={e => setTel(e.target.value)} placeholder="ext. or number" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Fax</Label>
              <Input value={fax} onChange={e => setFax(e.target.value)} placeholder="fax number" />
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => setConfirmDelete(true)}
            disabled={deleteMutation.isPending}
          >
            Remove Part…
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
              Save
            </Button>
          </div>
        </DialogFooter>

        <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove {assignment?.part || 'this part'} from the term?</AlertDialogTitle>
              <AlertDialogDescription>
                This removes the row from the current term sheet only — other terms are not affected.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => deleteMutation.mutate()}
              >
                {deleteMutation.isPending && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
                Remove Part
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={confirmShare} onOpenChange={setConfirmShare}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Room already used by {sharedWith}</AlertDialogTitle>
              <AlertDialogDescription>
                {sharedWith} is already in this courtroom on this term. Sharing a
                courtroom between parts is allowed (e.g. different sitting days) —
                just confirm this isn't a mistake.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Go back</AlertDialogCancel>
              <AlertDialogAction onClick={() => { setConfirmShare(false); saveMutation.mutate(); }}>
                Share the room
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
};
