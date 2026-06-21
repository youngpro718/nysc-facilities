import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@features/auth/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Calendar, MapPin, MessageSquare } from 'lucide-react';
import { DeliveryRoomPicker } from '@features/supply/components/supply/DeliveryRoomPicker';
import { requestSubmittedToast, requestFailedToast } from '@shared/utils/requestToast';

type Timing = 'anytime' | 'when_court_is_down' | 'specific_time';

export function RequestForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [where, setWhere] = useState('');
  const [whereRoomId, setWhereRoomId] = useState('');
  const [what, setWhat] = useState('');
  const [timing, setTiming] = useState<Timing>('anytime');
  const [specificAt, setSpecificAt] = useState('');

  const whereMissing = !where.trim() || !whereRoomId;
  const whatMissing = what.trim().length < 10;
  const specificMissing = timing === 'specific_time' && !specificAt;
  const canSubmit = !whereMissing && !whatMissing && !specificMissing;

  const submit = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not signed in');
      const description = what.trim();
      // staff_tasks.title is NOT NULL — derive from the first ~60 chars of the
      // description so the row is well-formed for existing fulfillment surfaces
      // (Tasks page, Work Center, notifications) without asking the user for a
      // separate title. is_request + requested_by + status = pending_approval
      // make the existing admin-notification trigger fire.
      const title =
        description.length > 60 ? description.slice(0, 60).trimEnd() + '…' : description;
      const { data, error } = await supabase
        .from('staff_tasks')
        .insert({
          title,
          created_by: user.id,
          requested_by: user.id,
          is_request: true,
          from_room_id: whereRoomId,
          description,
          status: 'pending_approval',
          task_type: 'request',
          timing_preference: timing,
          requested_for_at:
            timing === 'specific_time' ? new Date(specificAt).toISOString() : null,
        })
        .select('id')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      requestSubmittedToast({ id: data.id, type: 'request' });
      setWhere('');
      setWhereRoomId('');
      setWhat('');
      setTiming('anytime');
      setSpecificAt('');
      queryClient.invalidateQueries({ queryKey: ['my-requests', user?.id] });
      navigate('/my-requests?focus=' + data.id);
    },
    onError: (e: any) =>
      requestFailedToast(e?.message || 'Could not submit your request. Try again.'),
  });

  return (
    <form
      className="space-y-5 max-w-xl mx-auto"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit && !submit.isPending) submit.mutate();
      }}
    >
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5 text-sm font-medium">
          <MapPin className="h-4 w-4" /> Where <span className="text-destructive">*</span>
        </Label>
        <DeliveryRoomPicker
          value={where}
          onChange={(label, roomId) => {
            setWhere(label);
            setWhereRoomId(roomId || '');
          }}
          userId={user?.id}
          invalid={whereMissing && submit.isError}
          placeholder="Search for a room…"
          ariaLabel="Request location"
        />
        <p className="text-xs text-muted-foreground">
          Choose the room where the work is needed.
        </p>
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-1.5 text-sm font-medium">
          <MessageSquare className="h-4 w-4" /> What <span className="text-destructive">*</span>
        </Label>
        <Textarea
          value={what}
          onChange={(e) => setWhat(e.target.value)}
          placeholder="e.g., Lateral file cabinet on the east wall is busted — replace with another lateral."
          rows={5}
          required
          minLength={10}
          aria-describedby="request-description-help"
        />
        <p id="request-description-help" className="text-xs text-muted-foreground">
          {what.length > 0 && whatMissing
            ? 'A few more words help the court aide know what you need.'
            : 'Include what is broken, missing, moving, or needed.'}
        </p>
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-1.5 text-sm font-medium">
          <Calendar className="h-4 w-4" /> When can it happen?{' '}
          <span className="text-muted-foreground text-xs">(optional)</span>
        </Label>
        <div className="flex flex-col gap-2">
          {(
            [
              ['anytime', 'Anytime'],
              ['when_court_is_down', 'When court is down'],
              ['specific_time', 'By a specific time'],
            ] as [Timing, string][]
          ).map(([value, label]) => (
            <label key={value} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="timing"
                value={value}
                checked={timing === value}
                onChange={() => setTiming(value)}
              />
              {label}
            </label>
          ))}
        </div>
        {timing === 'specific_time' && (
          <Input
            type="datetime-local"
            value={specificAt}
            onChange={(e) => setSpecificAt(e.target.value)}
            className="max-w-xs"
            min={new Date().toISOString().slice(0, 16)}
            aria-label="Requested completion date and time"
            required
          />
        )}
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          disabled={!canSubmit || submit.isPending}
          className="w-full sm:w-auto"
        >
          {submit.isPending ? 'Submitting…' : 'Submit request'}
        </Button>
      </div>
    </form>
  );
}
