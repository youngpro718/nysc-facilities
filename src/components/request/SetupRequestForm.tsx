/**
 * SetupRequestForm - Structured form for room setup requests
 * 
 * Collects: room selection, date needed, attendee count, setup type, notes
 */

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ArrowLeft, Loader2, Users, Calendar, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useOccupantAssignments, DetailedRoomAssignment } from '@/hooks/occupants/useOccupantAssignments';

export type SetupType = 'meeting' | 'hearing' | 'training' | 'event' | 'other';

export interface SetupRequestData {
  roomId: string | null;
  roomDisplay: string;
  dateNeeded: Date | undefined;
  attendeeCount: number;
  setupType: SetupType;
  additionalNotes: string;
}

interface SetupRequestFormProps {
  onSubmit: (data: SetupRequestData) => void;
  onBack: () => void;
  isSubmitting: boolean;
}

const SETUP_TYPES: { value: SetupType; label: string }[] = [
  { value: 'meeting', label: 'Meeting' },
  { value: 'hearing', label: 'Hearing' },
  { value: 'training', label: 'Training' },
  { value: 'event', label: 'Event' },
  { value: 'other', label: 'Other' },
];

export function SetupRequestForm({ onSubmit, onBack, isSubmitting }: SetupRequestFormProps) {
  const { user } = useAuth();
  const { data: occupantData, isLoading: isLoadingRooms } = useOccupantAssignments(user?.id || '');

  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [manualRoomEntry, setManualRoomEntry] = useState('');
  const [dateNeeded, setDateNeeded] = useState<Date | undefined>(undefined);
  const [attendeeCount, setAttendeeCount] = useState<string>('');
  const [setupType, setSetupType] = useState<SetupType>('meeting');
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

  const isValid = (): boolean => {
    // Must have a room (selected or manual entry)
    const hasRoom = (selectedRoomId && selectedRoomId !== 'other') || manualRoomEntry.trim();
    // Must have a date
    const hasDate = !!dateNeeded;
    // Must have attendee count
    const hasCount = parseInt(attendeeCount) > 0;
    
    return !!hasRoom && hasDate && hasCount;
  };

  const handleSubmit = () => {
    if (!isValid()) return;

    onSubmit({
      roomId: selectedRoomId === 'other' ? null : selectedRoomId || null,
      roomDisplay: getRoomDisplay(),
      dateNeeded,
      attendeeCount: parseInt(attendeeCount) || 0,
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
          <p className="text-muted-foreground text-sm">Tell us what you need</p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Room Selection */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-muted-foreground" />
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
          
          {/* Manual entry when "other" is selected */}
          {selectedRoomId === 'other' && (
            <Input
              placeholder="Enter room number or name"
              value={manualRoomEntry}
              onChange={(e) => setManualRoomEntry(e.target.value)}
              className="mt-2"
            />
          )}
        </div>

        {/* Date Needed */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            When do you need it?
          </Label>
          <DatePicker
            value={dateNeeded}
            onChange={setDateNeeded}
            placeholder="Select date"
          />
        </div>

        {/* Attendee Count */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            How many people?
          </Label>
          <Input
            type="number"
            min="1"
            placeholder="Number of attendees"
            value={attendeeCount}
            onChange={(e) => setAttendeeCount(e.target.value)}
          />
        </div>

        {/* Setup Type */}
        <div className="space-y-2">
          <Label>What type of setup?</Label>
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

        {/* Additional Notes */}
        <div className="space-y-2">
          <Label>Special requirements (optional)</Label>
          <Textarea
            placeholder="e.g., Need projector, whiteboard, specific seating arrangement..."
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            rows={3}
          />
        </div>

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
