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
import { useOccupantAssignments } from '@features/occupants/hooks/useOccupantAssignments';
import { submitKeyRequest } from '@features/keys/services/keyRequestService';
import { supabase } from '@/lib/supabase';

export type KeyRequestType = 'new' | 'spare' | 'replacement' | 'temporary';

interface KeyRequestFormProps {
  /**
   * Called after a successful submit. Use this to close a dialog or navigate
   * away. The form itself only resets local state.
   */
  onSuccess?: () => void;
  /**
   * Called when the user clicks the secondary "Cancel" button. If omitted the
   * button is hidden — page contexts (vs. dialog) typically don't need it.
   */
  onCancel?: () => void;
  /** Visual variant — page uses a fuller layout, dialog stays compact. */
  variant?: 'page' | 'dialog';
}

export function KeyRequestForm({ onSuccess, onCancel, variant = 'dialog' }: KeyRequestFormProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: assignments } = useOccupantAssignments(user?.id || '');
  const rooms = assignments?.roomAssignments ?? [];
  const [requestType, setRequestType] = useState<KeyRequestType>('new');
  const [roomId, setRoomId] = useState('');
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

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.room_id === roomId),
    [roomId, rooms],
  );

  const reset = () => {
    setRequestType('new');
    setRoomId('');
    setOtherLocation('');
    setReason('');
    setQuantity('1');
    setContact('');
  };

  const handleSubmit = async () => {
    if (!user?.id) return;
    if (!roomId && !otherLocation.trim()) {
      toast.error('Choose a room or describe the key location.');
      return;
    }
    if (!reason.trim()) {
      toast.error('Tell the key office why the key is needed.');
      return;
    }

    setSubmitting(true);
    try {
      await submitKeyRequest({
        user_id: user.id,
        request_type: requestType,
        room_id: roomId || null,
        room_other: roomId ? null : otherLocation.trim(),
        reason: reason.trim(),
        quantity: Math.max(1, Number.parseInt(quantity, 10) || 1),
        emergency_contact: contact.trim() || null,
      });
      await queryClient.invalidateQueries({ queryKey: ['key-requests', user.id] });
      await queryClient.invalidateQueries({ queryKey: ['my-requests', user.id] });
      toast.success('Key request sent', {
        description: 'The key office will review it shortly. You can track it under My Requests.',
      });
      reset();
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
              The database update for this workflow has not been deployed yet. Contact the facilities key office directly.
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

      {rooms.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="key-request-room">Assigned room</Label>
          <Select
            value={roomId || '__other__'}
            onValueChange={(value) => setRoomId(value === '__other__' ? '' : value)}
          >
            <SelectTrigger id="key-request-room" aria-label="Assigned room">
              <SelectValue placeholder="Choose a room" />
            </SelectTrigger>
            <SelectContent>
              {rooms.map((room) => (
                <SelectItem key={room.room_id} value={room.room_id}>
                  Room {room.room_number || room.room_name}
                </SelectItem>
              ))}
              <SelectItem value="__other__">Different location</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {!roomId && (
        <div className="space-y-2">
          <Label htmlFor="key-location">Key location</Label>
          <Input
            id="key-location"
            value={otherLocation}
            onChange={(event) => setOtherLocation(event.target.value)}
            placeholder="Room, door, cabinet, or area"
          />
        </div>
      )}

      {selectedRoom && (
        <p className="text-xs text-muted-foreground">
          Requesting access for Room {selectedRoom.room_number || selectedRoom.room_name}.
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="key-reason">Why is this key needed?</Label>
        <Textarea
          id="key-reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Describe the access need and who will use the key."
          rows={variant === 'page' ? 5 : 4}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="key-quantity">Quantity</Label>
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
          <Label htmlFor="key-contact">Contact number</Label>
          <Input
            id="key-contact"
            value={contact}
            onChange={(event) => setContact(event.target.value)}
            placeholder="Optional"
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
          disabled={submitting || keyRequestsUnavailable}
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
