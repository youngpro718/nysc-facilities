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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@shared/hooks/use-toast';
import { useCourtPersonnel } from '@features/court/hooks/useCourtPersonnel';

export interface EditableAssignment {
  id: string;
  part: string;
  justice: string;
  room: string;
  tel: string;
  fax: string;
  sergeant: string;
  clerks: string[];
}

interface Props {
  assignment: EditableAssignment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NONE = '__none__';

export const AssignmentEditDialog: React.FC<Props> = ({ assignment, open, onOpenChange }) => {
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

  useEffect(() => {
    if (!assignment) return;
    setPart(assignment.part === '—' ? '' : assignment.part);
    setJustice(assignment.justice === '—' ? NONE : assignment.justice);
    setSergeant(assignment.sergeant === '—' ? NONE : assignment.sergeant);
    setClerks(assignment.clerks.filter(c => c && c !== '—'));
    setTel(assignment.tel === '—' ? '' : assignment.tel);
    setFax(assignment.fax === '—' ? '' : assignment.fax);
    setClerkToAdd(NONE);
  }, [assignment]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!assignment) throw new Error('No assignment');
      const payload = {
        part: part.trim() || null,
        justice: justice === NONE ? null : justice,
        sergeant: sergeant === NONE ? null : sergeant,
        clerks: clerks.length ? clerks : null,
        tel: tel.trim() || null,
        fax: fax.trim() || null,
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
              <Input value={assignment?.room ?? ''} disabled />
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

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
