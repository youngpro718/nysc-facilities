/**
 * RoomList Component
 * 
 * Displays a list of rooms in a grid layout.
 * 
 * NOTE: This component no longer handles loading/error/empty states.
 * Use DataState wrapper for state management.
 * 
 * @module features/facilities/components/RoomList
 */

import { RoomCard } from './RoomCard';
import type { Room } from '../model';

interface RoomListProps {
  rooms: Room[];
  onRoomClick?: (room: Room) => void;
}

export function RoomList({ rooms, onRoomClick }: RoomListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {rooms.map((room) => (
        <RoomCard key={room.id} room={room} onClick={onRoomClick} />
      ))}
    </div>
  );
}
