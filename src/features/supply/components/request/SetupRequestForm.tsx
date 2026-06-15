/**
 * SetupRequestForm - Structured form for room / event setup requests
 *
 * The core ask is "bring these items to this room at this time":
 * furniture with quantities, destination room, date + time, and how
 * the room should be arranged.
 */

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Loader2,
  Calendar,
  Clock,
  MapPin,
  Minus,
  Plus,
  Armchair,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { useAuth } from '@features/auth/hooks/useAuth';
import { useOccupantAssignments, DetailedRoomAssignment } from '@features/occupants/hooks/useOccupantAssignments';

export type SetupType = 'meeting' | 'hearing' | 'training' | 'event' | 'other';

export interface SetupItemRequest {
  name: string;
  quantity: number;
}

export interface SetupRequestData {
  roomId: string | null;
  roomDisplay: string;
  dateNeeded: Date | undefined;
  timeNeeded: string;
  items: SetupItemRequest[];
  attendeeCount: number | null;
  setupType: SetupType;
  additionalNotes: string;
}

interface SetupRequestFormProps {
  onSubmit: (data: SetupRequestData) => void;
  onBack: () => void;
  isSubmitting: boolean;
}

const SETUP_TYPES: { value: SetupType; label: string }[] = [
  { value: 'event', label: 'Event' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'hearing', label: 'Hearing' },
  { value: 'training', label: 'Training' },
  { value: 'other', label: 'Other' },
];

// Items court aides are most often asked to bring
const FURNITURE_ITEMS = ['Tables', 'Chairs', 'Desks'] as const;

export function SetupRequestForm({ onSubmit, onBack, isSubmitting }: SetupRequestFormProps) {
  const { user } = useAuth();
  const { data: occupantData, isLoading: isLoadingRooms } = useOccupantAssignments(user?.id || '');

  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [manualRoomEntry, setManualRoomEntry] = useState('');
  const [dateNeeded, setDateNeeded] = useState<Date | undefined>(undefined);
  const [timeNeeded, setTimeNeeded] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [otherItem, setOtherItem] = useState('');
  const [attendeeCount, setAttendeeCount] = useState<string>('');
  const [setupType, setSetupType] = useState<SetupType>('event');
  const [additionalNotes, setAdditionalNotes] = useState('');

  // Get user's assigned rooms (non-storage only)
  const assignedRooms = occupantData?.roomAssignments.filter(r => !r.is_storage) || [];

  // Auto-select primary room if user has one
  useEffect(() => {
    if (occupantData?.primaryRoom && !selectedRoomId) {
      setSelectedRoomId(occupantData.primaryRoom.room_id);
    }
  }, [occupantData?.primaryRoom, selectedRoomId]);

  const getSelectedRoom = (): DetailedRoomAssignment | undefined => {
    return assignedRooms.find(r => r.room_id === selectedRoomId);
  };

  const getRoomDisplay = (): string => {
    if (selectedRoomId === 'other') {
      return manualRoomEntry || 'Unspecified room';
    }
    const room = getSelectedRoom();
    if (room) {
      return `${room.room_name} (${room.room_number}) - ${room.building_name}`;
    }
    return manualRoomEntry || 'Unspecified room';
  };

  const adjustQuantity = (item: string, delta: number) => {
    setQuantities(prev => {
      const next = Math.max(0, (prev[item] ?? 0) + delta);
      return { ...prev, [item]: next };
    });
  };

  const collectItems = (): SetupItemRequest[] => {
    const items: SetupItemRequest[] = FURNITURE_ITEMS
      .filter(name => (quantities[name] ?? 0) > 0)
      .map(name => ({ name, quantity: quantities[name] }));
    if (otherItem.trim()) {
      items.push({ name: otherItem.trim(), quantity: 1 });
    }
    return items;
  };

  const isValid = (): boolean => {
    const hasRoom = (selectedRoomId && selectedRoomId !== 'other') || manualRoomEntry.trim();
    const hasDate = !!dateNeeded;
    // Need either items to bring or arrangement notes — otherwise there's nothing to do
    const hasWork = collectItems().length > 0 || additionalNotes.trim().length > 0;
    return !!hasRoom && hasDate && hasWork;
  };

  const handleSubmit = () => {
    if (!isValid()) return;

    onSubmit({
      roomId: selectedRoomId === 'other' ? null : selectedRoomId || null,
      roomDisplay: getRoomDisplay(),
      dateNeeded,
      timeNeeded,
      items: collectItems(),
      attendeeCount: parseInt(attendeeCount) > 0 ? parseInt(attendeeCount) : null,
      setupType,
      additionalNotes,
    });
  };

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Set up a room</h1>
          <p className="text-muted-foreground text-sm">What should we bring, where, and when?</p>
        </div>
      </div>

      <div className="space-y-5">
        {/* What's needed */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Armchair className="h-4 w-4 text-muted-foreground" />
            What do you need brought in?
          </Label>
          <div className="rounded-xl border divide-y">
            {FURNITURE_ITEMS.map(item => {
              const qty = quantities[item] ?? 0;
              return (
                <div key={item} className="flex items-center justify-between px-4 py-2.5">
                  <span className={`text-sm ${qty > 0 ? 'font-medium' : 'text-muted-foreground'}`}>
                    {item}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      disabled={qty === 0}
                      onClick={() => adjustQuantity(item, -1)}
                      aria-label={`Fewer ${item}`}
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                    <span className={`w-8 text-center text-sm tabular-nums ${qty > 0 ? 'font-semibold' : 'text-muted-foreground/50'}`}>
                      {qty}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={() => adjustQuantity(item, 1)}
                      aria-label={`More ${item}`}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
            <div className="px-4 py-2.5">
              <Input
                placeholder="Something else? (e.g., extension cords, coat rack)"
                value={otherItem}
                onChange={(e) => setOtherItem(e.target.value)}
                className="border-0 px-0 h-8 shadow-none focus-visible:ring-0 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Room Selection */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            Which room?
          </Label>
          {isLoadingRooms ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading your rooms...
            </div>
          ) : assignedRooms.length > 0 ? (
            <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a room" />
              </SelectTrigger>
              <SelectContent>
                {assignedRooms.map((room) => (
                  <SelectItem key={room.room_id} value={room.room_id}>
                    {room.room_name} ({room.room_number}) - {room.building_name}
                  </SelectItem>
                ))}
                <SelectItem value="other">Other room (enter manually)</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Input
              placeholder="Enter room number or name"
              value={manualRoomEntry}
              onChange={(e) => setManualRoomEntry(e.target.value)}
            />
          )}

          {selectedRoomId === 'other' && (
            <Input
              placeholder="Enter room number or name"
              value={manualRoomEntry}
              onChange={(e) => setManualRoomEntry(e.target.value)}
              className="mt-2"
            />
          )}
        </div>

        {/* When: date + time side by side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              What day?
            </Label>
            <DatePicker
              value={dateNeeded}
              onChange={setDateNeeded}
              placeholder="Select date"
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              By what time?
            </Label>
            <Input
              type="time"
              value={timeNeeded}
              onChange={(e) => setTimeNeeded(e.target.value)}
            />
          </div>
        </div>

        {/* Occasion + headcount side by side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>What's the occasion?</Label>
            <Select value={setupType} onValueChange={(v) => setSetupType(v as SetupType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SETUP_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              How many people? <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              type="number"
              min="1"
              placeholder="Headcount"
              value={attendeeCount}
              onChange={(e) => setAttendeeCount(e.target.value)}
            />
          </div>
        </div>

        {/* Arrangement notes */}
        <div className="space-y-2">
          <Label>How should the room be arranged?</Label>
          <Textarea
            placeholder="e.g., 6 tables along the back wall, chairs in rows facing the podium, leave space near the door..."
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            rows={3}
          />
        </div>

        {/* Live summary so the request reads back like the real ask */}
        {(collectItems().length > 0 && dateNeeded) && (
          <p className="text-xs text-muted-foreground rounded-lg bg-muted/50 px-3 py-2">
            {collectItems().map(i => `${i.quantity > 1 ? `${i.quantity} ` : ''}${i.name}`).join(', ')}
            {' → '}{getRoomDisplay()}
            {' on '}{format(dateNeeded, 'EEE, MMM d')}
            {timeNeeded ? ` by ${timeNeeded}` : ''}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onBack} className="flex-1">
            Back
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid() || isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              'Submit Request'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
