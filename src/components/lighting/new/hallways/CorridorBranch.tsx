import { Card } from '@/components/ui/card';
import { CorridorRoomCard } from './CorridorRoomCard';
import { HallwayRoom } from '@/hooks/useHallwayRooms';

interface CorridorBranchProps {
  position: 'start' | 'middle' | 'end';
  leftRooms: HallwayRoom[];
  rightRooms: HallwayRoom[];
  onRoomClick?: (room: HallwayRoom) => void;
}

export function CorridorBranch({ position, leftRooms, rightRooms, onRoomClick }: CorridorBranchProps) {
  const hasRooms = leftRooms.length > 0 || rightRooms.length > 0;
  
  if (!hasRooms) return null;

  const getPositionLabel = () => {
    if (position === 'start') return 'Start';
    if (position === 'middle') return 'Middle';
    return 'End';
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <Card className="bg-background/50 border-primary/20 p-2 min-w-[120px]">
        <div className="text-[10px] font-semibold text-primary/60 uppercase tracking-wide text-center mb-1.5">
          {getPositionLabel()}
        </div>
        <div className="flex gap-2">
          {/* Left Column */}
          <div className="flex flex-col gap-1 flex-1">
            {leftRooms.length > 0 && (
              <>
                <div className="text-[9px] text-muted-foreground text-center">Left</div>
                {leftRooms
                  .sort((a, b) => a.sequence_order - b.sequence_order)
                  .map((room) => (
                    <CorridorRoomCard
                      key={room.id}
                      room={room}
                      onClick={() => onRoomClick?.(room)}
                    />
                  ))}
              </>
            )}
          </div>
          
          {/* Right Column */}
          <div className="flex flex-col gap-1 flex-1">
            {rightRooms.length > 0 && (
              <>
                <div className="text-[9px] text-muted-foreground text-center">Right</div>
                {rightRooms
                  .sort((a, b) => a.sequence_order - b.sequence_order)
                  .map((room) => (
                    <CorridorRoomCard
                      key={room.id}
                      room={room}
                      onClick={() => onRoomClick?.(room)}
                    />
                  ))}
              </>
            )}
          </div>
        </div>
      </Card>
      
      {/* Connector line to hallway */}
      <div className="w-0.5 h-4 bg-primary/30" />
    </div>
  );
}
