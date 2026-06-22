import { useEffect, useMemo, useState } from 'react';
import { Loader2, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { ModalFrame } from '@shared/components/common/common/ModalFrame';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Candidate = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
};

interface SetSupervisorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The user whose supervisor is being set. */
  userId: string;
  userLabel: string;
  /** Currently-assigned supervisor id (null when unset). */
  currentSupervisorId: string | null;
  /** Called after a successful save so the parent can refetch. */
  onSaved?: () => void;
}

const NONE_VALUE = '__none__';

function displayName(c: Candidate) {
  const full = `${c.first_name || ''} ${c.last_name || ''}`.trim();
  return full || c.email;
}

export function SetSupervisorDialog({
  open,
  onOpenChange,
  userId,
  userLabel,
  currentSupervisorId,
  onSaved,
}: SetSupervisorDialogProps) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('');
  const [selectedId, setSelectedId] = useState<string>(
    currentSupervisorId ?? NONE_VALUE,
  );

  useEffect(() => {
    setSelectedId(currentSupervisorId ?? NONE_VALUE);
  }, [currentSupervisorId, open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    supabase
      .from('profiles')
      .select('id, email, first_name, last_name')
      .neq('id', userId)
      .order('first_name', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          toast.error(`Could not load users: ${error.message}`);
          setCandidates([]);
        } else {
          setCandidates((data || []) as Candidate[]);
        }
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, userId]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter((c) => {
      const name = displayName(c).toLowerCase();
      return name.includes(q) || c.email.toLowerCase().includes(q);
    });
  }, [candidates, filter]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const supervisorId = selectedId === NONE_VALUE ? null : selectedId;
      const { error } = await supabase.rpc('admin_set_user_supervisor', {
        p_user_id: userId,
        p_supervisor_id: supervisorId,
      });
      if (error) throw error;
      toast.success(
        supervisorId
          ? `Supervisor set for ${userLabel}.`
          : `Supervisor cleared for ${userLabel}.`,
      );
      onSaved?.();
      onOpenChange(false);
    } catch (e) {
      toast.error(`Failed: ${(e as Error)?.message || String(e)}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalFrame
      open={open}
      onOpenChange={onOpenChange}
      title="Set supervisor"
      description={`Choose who approves key requests for ${userLabel}. Leave blank to clear.`}
      size="sm"
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="supervisor-filter">Filter</Label>
          <Input
            id="supervisor-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search by name or email"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="supervisor-select">Supervisor</Label>
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger id="supervisor-select" aria-label="Supervisor">
              <SelectValue placeholder={loading ? 'Loading…' : 'No supervisor'} />
            </SelectTrigger>
            <SelectContent className="max-h-[260px]">
              <SelectItem value={NONE_VALUE}>— No supervisor —</SelectItem>
              {filtered.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {displayName(c)}{' '}
                  <span className="text-xs text-muted-foreground">({c.email})</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving || loading}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCheck className="mr-2 h-4 w-4" />}
            Save
          </Button>
        </div>
      </div>
    </ModalFrame>
  );
}
