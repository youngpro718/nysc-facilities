import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, Lightbulb, Zap, Flame } from 'lucide-react';
import { HallwayRoom } from '@/hooks/useHallwayRooms';

interface CorridorRoomCardProps {
  room: HallwayRoom;
  onClick?: () => void;
}

export function CorridorRoomCard({ room, onClick }: CorridorRoomCardProps) {
  const getCeilingIcon = () => {
    if (room.room.ceiling_height === 'high') {
      return <ArrowUp className="h-3 w-3 text-primary" />;
    }
    if (room.room.ceiling_height === 'double_height') {
      return <ArrowUp className="h-3 w-3 text-primary" />;
    }
    return null;
  };

  const getBulbIcon = () => {
    if (room.room.primary_bulb_type === 'LED') {
      return <Lightbulb className="h-3 w-3 text-yellow-500" />;
    }
    if (room.room.primary_bulb_type === 'Fluorescent') {
      return <Zap className="h-3 w-3 text-blue-500" />;
    }
    if (room.room.primary_bulb_type === 'Incandescent') {
      return <Flame className="h-3 w-3 text-orange-500" />;
    }
    return null;
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="h-auto py-1.5 px-2 bg-background hover:bg-primary/10 hover:border-primary transition-all"
    >
      <div className="flex flex-col items-center gap-0.5 min-w-[50px]">
        <div className="flex items-center gap-1">
          {getCeilingIcon()}
          {getBulbIcon()}
        </div>
        <span className="font-semibold text-xs">{room.room.room_number}</span>
      </div>
    </Button>
  );
}
