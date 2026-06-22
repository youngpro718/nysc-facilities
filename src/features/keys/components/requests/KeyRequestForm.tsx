import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, KeyRound, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@features/auth/hooks/useAuth';
import { submitKeyRequest } from '@features/keys/services/keyRequestService';
import { DeliveryRoomPicker } from '@features/supply/components/supply/DeliveryRoomPicker';
import { supabase } from '@/lib/supabase';

export type KeyRequestType = 'new' | 'spare' | 'replacement' | 'temporary';

interface KeyRequestFormProps {
  /** Called after a successful submit. Use this to close a dialog or navigate. */
  onSuccess?: () => void;
  /** Called when the user clicks the secondary "Cancel" button. */
  onCancel?: () => void;
  /** Visual variant — page uses a fuller layout, dialog stays compact. */
  variant?: 'page' | 'dialog';
}

type Mode = 'pick' | 'other';

export function KeyRequestForm({ onSuccess, onCancel, variant = 'dialog' }: KeyRequestFormProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [requestType, setRequestType] = useState<KeyRequestType>('new');
  const [mode, setMode] = useState<Mode>('pick');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomLabel, setRoomLabel] = useState('');
  const [otherLocation, setOtherLocation] = useState('');
  const [reason, setReason] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [contact, setContact] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { isError: keyRequestsUnavailable } = useQuery({
    queryKey: ['key-requests-availability', user?.id],
    enabled: !!user?.id,
    retry: false,
    queryFn: async () => {
      const { error } = await supabase.from('key_requests').select('id').limit(1);
      if (error) throw error;
      return true;
    },
  });

  const canSubmit = useMemo(() => {
    if (mode === 'pick') return !!roomId;
    return otherLocation.trim().length > 0 && reason.trim().length > 0;
  }, [mode, roomId, otherLocation, reason]);

  const handleSubmit = async () => {
    if (!user?.id) return;
    if (!canSubmit) {
      toast.error(mode === 'pick'
        ? 'Pick a room.'
        : 'Describe the location and why the key is needed.');
      return;
    }

    setSubmitting(true);
    try {
      await submitKeyRequest({
        user_id: user.id,
        request_type: requestType,
        room_id: mode === 'pick' ? roomId : null,
        room_other: mode === 'pick' ? null : otherLocation.trim(),
        // Database NOT NULL constraint on reason — synthesize a default when the
        // user picked a room from the list (the room itself IS the reason).
        reason: mode === 'pick'
          ? `Key for ${roomLabel || 'selected room'}`
          : reason.trim(),
        quantity: Math.max(1, Math.min(10, Number.parseInt(quantity, 10) || 1)),
        emergency_contact: contact.trim() || null,
      });
      await queryClient.invalidateQueries({ queryKey: ['key-requests', user.id] });
      await queryClient.invalidateQueries({ queryKey: ['key-requests-pending-count'] });
      await queryClient.invalidateQueries({ queryKey: ['my-requests', user.id] });
      toast.success('Key request sent', {
        description: 'The Facility Coordinator will review it shortly.',
      });
      // Reset
      setRequestType('new');
      setMode('pick');
      setRoomId(null);
      setRoomLabel('');
      setOtherLocation('');
      setReason('');
      setQuantity('1');
      setContact('');
      onSuccess?.();
    } catch {
      toast.error('Could not submit the key request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {keyRequestsUnavailable && (
        <div className="flex gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
          <div>
            <p className="font-medium">Key requests are temporarily unavailable.</p>
            <p className="text-muted-foreground">
              The database update for this workflow has not been deployed yet. Contact the Facility Coordinator directly.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="key-request-type">Request type</Label>
        <Select value={requestType} onValueChange={(value) => setRequestType(value as KeyRequestType)}>
          <SelectTrigger id="key-request-type" aria-label="Key request type"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="new">New key</SelectItem>
            <SelectItem value="spare">Spare key</SelectItem>
            <SelectItem value="replacement">Replacement key</SelectItem>
            <SelectItem value="temporary">Temporary key</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {mode === 'pick' ? (
        <div className="space-y-2">
          <Label>Key location</Label>
          <DeliveryRoomPicker
            value={roomLabel}
            onChange={(label, id) => {
              setRoomLabel(label);
              setRoomId(id || null);
            }}
            userId={user?.id}
            placeholder="Search for a room…"
            ariaLabel="Key location"
          />
          <button
            type="button"
            onClick={() => {
              setMode('other');
              setRoomId(null);
              setRoomLabel('');
            }}
            className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Can't find it? Describe a different location instead
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <Label htmlFor="key-other-location">Describe the location</Label>
            <Input
              id="key-other-location"
              value={otherLocation}
              onChange={(event) => setOtherLocation(event.target.value)}
              placeholder="Door, cabinet, storage area, etc."
              autoFocus
            />
            <button
              type="button"
              onClick={() => {
                setMode('pick');
                setOtherLocation('');
                setReason('');
              }}
              className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              Pick a room from the list instead
            </button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="key-reason">Why is this key needed?</Label>
            <Textarea
              id="key-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="A short description so the Facility Coordinator knows the context."
              rows={variant === 'page' ? 4 : 3}
            />
          </div>
        </>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="key-quantity">How many keys?</Label>
          <Input
            id="key-quantity"
            type="number"
            min={1}
            max={10}
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="key-contact">Contact number <span className="text-muted-foreground font-normal">(optional)</span></Label>
          <Input
            id="key-contact"
            value={contact}
            onChange={(event) => setContact(event.target.value)}
            placeholder="Best phone to reach you"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t pt-4">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        )}
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || keyRequestsUnavailable || !canSubmit}
        >
          {submitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <KeyRound className="mr-2 h-4 w-4" />
          )}
          Submit request
        </Button>
      </div>
    </div>
  );
}
