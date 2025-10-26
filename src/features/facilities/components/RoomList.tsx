/**
 * RoomList Component
 * 
 * Displays a list of rooms with loading and error states
 * 
 * @module features/facilities/components/RoomList
 */

import { RoomCard } from './RoomCard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import type { Room } from '../model';

interface RoomListProps {
  rooms: Room[];
  isLoading?: boolean;
  error?: Error | null;
  onRoomClick?: (room: Room) => void;
  emptyMessage?: string;
}

export function RoomList({
  rooms,
  isLoading,
  error,
  onRoomClick,
  emptyMessage = 'No rooms found',
}: RoomListProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load rooms: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  // Empty state
  if (!rooms || rooms.length === 0) {
    return (
      <Alert>
        <AlertDescription>{emptyMessage}</AlertDescription>
      </Alert>
    );
  }

  // Rooms list
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {rooms.map((room) => (
        <RoomCard key={room.id} room={room} onClick={onRoomClick} />
      ))}
    </div>
  );
}
