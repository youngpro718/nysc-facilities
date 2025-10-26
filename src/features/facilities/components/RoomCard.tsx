/**
 * RoomCard Component
 * 
 * Displays a single room with its details in a card format
 * 
 * @module features/facilities/components/RoomCard
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, MapPin } from 'lucide-react';
import type { Room } from '../model';
import {
  getRoomDisplayName,
  getRoomStatusBadgeClass,
  getRoomStatusLabel,
  getRoomTypeLabel,
} from '../model';

interface RoomCardProps {
  room: Room;
  onClick?: (room: Room) => void;
}

export function RoomCard({ room, onClick }: RoomCardProps) {
  const handleClick = () => {
    if (onClick) {
      onClick(room);
    }
  };

  return (
    <Card
      className={`cursor-pointer hover:shadow-lg transition-shadow ${
        onClick ? 'hover:border-primary' : ''
      }`}
      onClick={handleClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{getRoomDisplayName(room)}</CardTitle>
          <Badge className={getRoomStatusBadgeClass(room.status)}>
            {getRoomStatusLabel(room.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Building & Floor */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Building2 className="h-4 w-4" />
          <span>
            {room.building?.name || 'Unknown Building'} -{' '}
            {room.floor?.name || `Floor ${room.floor?.floor_number || '?'}`}
          </span>
        </div>

        {/* Room Type */}
        {room.room_type && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{getRoomTypeLabel(room.room_type)}</span>
          </div>
        )}

        {/* Capacity */}
        {room.capacity && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>Capacity: {room.capacity}</span>
          </div>
        )}

        {/* Area */}
        {room.area_sqft && (
          <div className="text-sm text-muted-foreground">
            {room.area_sqft.toLocaleString()} sq ft
          </div>
        )}
      </CardContent>
    </Card>
  );
}
