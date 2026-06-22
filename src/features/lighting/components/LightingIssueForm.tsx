import { useMemo, useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Lightbulb, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@features/auth/hooks/useAuth';
import { DeliveryRoomPicker } from '@features/supply/components/supply/DeliveryRoomPicker';
import { useSpaceFixtures } from '@features/lighting/hooks/useLightingData';
import {
  submitLightingIssue,
  type LightingBulbType,
  type LightingCeilingAccess,
  type LightingIssuePriority,
  type LightingIssueType,
} from '@features/lighting/services/lightingIssueService';

interface LightingIssueFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  variant?: 'page' | 'dialog';
}

type Mode = 'pick' | 'other';

const TYPE_OPTIONS: { value: LightingIssueType; label: string }[] = [
  { value: 'out', label: 'Light is out' },
  { value: 'flickering', label: 'Flickering' },
  { value: 'dim', label: 'Too dim' },
  { value: 'buzzing', label: 'Buzzing / humming' },
  { value: 'damaged', label: 'Fixture damaged' },
  { value: 'other', label: 'Other' },
];

const PRIORITY_OPTIONS: { value: LightingIssuePriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High — affecting safety or work' },
];

const BULB_OPTIONS: { value: LightingBulbType; label: string }[] = [
  { value: 'unknown', label: "I'm not sure" },
  { value: 'led', label: 'LED' },
  { value: 'fluorescent', label: 'Fluorescent (long tube)' },
  { value: 'screw_in', label: 'Regular screw-in bulb' },
];

const CEILING_OPTIONS: { value: LightingCeilingAccess; label: string }[] = [
  { value: 'unknown', label: "I'm not sure" },
  { value: 'normal', label: 'Normal height' },
  { value: 'high', label: 'High ceiling' },
  { value: 'hard_to_reach', label: 'Hard to reach (needs lift)' },
];

export function LightingIssueForm({ onSuccess, onCancel, variant = 'dialog' }: LightingIssueFormProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [issueType, setIssueType] = useState<LightingIssueType>('out');
  const [priority, setPriority] = useState<LightingIssuePriority>('medium');
  const [bulbType, setBulbType] = useState<LightingBulbType>('unknown');
  const [ceilingAccess, setCeilingAccess] = useState<LightingCeilingAccess>('unknown');
  const [mode, setMode] = useState<Mode>('pick');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomLabel, setRoomLabel] = useState('');
  const [fixtureId, setFixtureId] = useState<string>('__unsure__');
  const [otherLocation, setOtherLocation] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data: roomFixtures = [] } = useSpaceFixtures(roomId ?? '', 'room');

  // Reset fixture selection when room changes
  useEffect(() => {
    setFixtureId('__unsure__');
  }, [roomId]);

  const canSubmit = useMemo(() => {
    if (mode === 'pick') return !!roomId;
    return otherLocation.trim().length > 0;
  }, [mode, roomId, otherLocation]);

  const handleSubmit = async () => {
    if (!user?.id) return;
    if (!canSubmit) {
      toast.error(mode === 'pick' ? 'Pick a room.' : 'Describe the location.');
      return;
    }
    setSubmitting(true);
    try {
      const synthesizedDescription =
        description.trim() ||
        (mode === 'pick'
          ? `${TYPE_OPTIONS.find((o) => o.value === issueType)?.label} — ${roomLabel}`
          : `${TYPE_OPTIONS.find((o) => o.value === issueType)?.label} — ${otherLocation.trim()}`);
      await submitLightingIssue({
        issue_type: issueType,
        priority,
        description: synthesizedDescription,
        room_id: mode === 'pick' ? roomId : null,
        location_description: mode === 'pick' ? null : otherLocation.trim(),
        bulb_type: bulbType,
        ceiling_access: ceilingAccess,
      });
      await queryClient.invalidateQueries({ queryKey: ['lighting-issues-open-count'] });
      await queryClient.invalidateQueries({ queryKey: ['lighting-issues', 'staff'] });
      toast.success('Lighting issue reported', {
        description: 'The Facility Coordinator will take a look shortly.',
      });
      setIssueType('out');
      setPriority('medium');
      setBulbType('unknown');
      setCeilingAccess('unknown');
      setMode('pick');
      setRoomId(null);
      setRoomLabel('');
      setOtherLocation('');
      setDescription('');
      onSuccess?.();
    } catch (e) {
      toast.error(`Could not submit: ${(e as Error)?.message || 'unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="lighting-type">What's wrong?</Label>
        <Select value={issueType} onValueChange={(v) => setIssueType(v as LightingIssueType)}>
          <SelectTrigger id="lighting-type" aria-label="Issue type"><SelectValue /></SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {mode === 'pick' ? (
        <div className="space-y-2">
          <Label>Where</Label>
          <DeliveryRoomPicker
            value={roomLabel}
            onChange={(label, id) => {
              setRoomLabel(label);
              setRoomId(id || null);
            }}
            userId={user?.id}
            placeholder="Search for a room…"
            ariaLabel="Room"
          />
          <button
            type="button"
            onClick={() => { setMode('other'); setRoomId(null); setRoomLabel(''); }}
            className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Can't find it? Describe a different location instead
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="lighting-other-location">Describe the location</Label>
          <Input
            id="lighting-other-location"
            value={otherLocation}
            onChange={(e) => setOtherLocation(e.target.value)}
            placeholder="Hallway, stairwell, area, etc."
            autoFocus
          />
          <button
            type="button"
            onClick={() => { setMode('pick'); setOtherLocation(''); }}
            className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Pick a room from the list instead
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="lighting-priority">Priority</Label>
          <Select value={priority} onValueChange={(v) => setPriority(v as LightingIssuePriority)}>
            <SelectTrigger id="lighting-priority" aria-label="Priority"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PRIORITY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="lighting-bulb">What kind of bulb? <span className="text-muted-foreground font-normal">(if you know)</span></Label>
          <Select value={bulbType} onValueChange={(v) => setBulbType(v as LightingBulbType)}>
            <SelectTrigger id="lighting-bulb" aria-label="Bulb type"><SelectValue /></SelectTrigger>
            <SelectContent>
              {BULB_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="lighting-ceiling">Ceiling height <span className="text-muted-foreground font-normal">(helps us bring the right gear)</span></Label>
        <Select value={ceilingAccess} onValueChange={(v) => setCeilingAccess(v as LightingCeilingAccess)}>
          <SelectTrigger id="lighting-ceiling" aria-label="Ceiling access"><SelectValue /></SelectTrigger>
          <SelectContent>
            {CEILING_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="lighting-description">More details <span className="text-muted-foreground font-normal">(optional)</span></Label>
        <Textarea
          id="lighting-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Anything that helps — e.g. 'the bulb closest to the door is out'"
          rows={variant === 'page' ? 4 : 3}
        />
      </div>

      <div className="flex justify-end gap-2 border-t pt-4">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>Cancel</Button>
        )}
        <Button type="button" onClick={handleSubmit} disabled={submitting || !canSubmit}>
          {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lightbulb className="mr-2 h-4 w-4" />}
          Send report
        </Button>
      </div>
    </div>
  );
}
