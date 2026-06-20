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
  const [what, setWhat] = useState('');
  const [timing, setTiming] = useState<Timing>('anytime');
  const [specificAt, setSpecificAt] = useState('');

  const whereMissing = !where.trim();
  const whatMissing = what.trim().length < 10;
  const specificMissing = timing === 'specific_time' && !specificAt;
  const canSubmit = !whereMissing && !whatMissing && !specificMissing;

  const submit = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not signed in');
      const { data, error } = await supabase
        .from('staff_tasks')
        .insert({
          created_by: user.id,
          room_id: where.trim() || null,
          description: what.trim(),
          status: 'pending',
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
          onChange={setWhere}
          userId={user?.id}
          invalid={whereMissing && submit.isError}
          placeholder="Search for a room…"
        />
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
        />
        {what.length > 0 && whatMissing && (
          <p className="text-xs text-muted-foreground">
            A few more words help the court aide know what you need.
          </p>
        )}
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
