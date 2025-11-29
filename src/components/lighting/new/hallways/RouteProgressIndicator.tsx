import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, ArrowRight } from 'lucide-react';
import { HallwayLandmark } from '@/hooks/useHallwayLandmarks';
import { HallwayRoom } from '@/hooks/useHallwayRooms';
import { CorridorRoomCard } from './CorridorRoomCard';
import { CorridorLandmark } from './CorridorLandmark';

interface RouteProgressIndicatorProps {
  landmarks: HallwayLandmark[];
  hallwayRooms: HallwayRoom[];
  currentFixtureSequence: number;
  totalFixtures: number;
  startReference?: string | null;
  endReference?: string | null;
  onRoomClick?: (roomId: string) => void;
  onLandmarkClick?: (landmarkId: string) => void;
}

export function RouteProgressIndicator({
  landmarks,
  hallwayRooms,
  currentFixtureSequence,
  totalFixtures,
  startReference,
  endReference,
  onRoomClick,
  onLandmarkClick,
}: RouteProgressIndicatorProps) {
  // Group rooms by side
  const leftRooms = hallwayRooms.filter(r => r.side === 'left').sort((a, b) => a.sequence_order - b.sequence_order);
  const rightRooms = hallwayRooms.filter(r => r.side === 'right').sort((a, b) => a.sequence_order - b.sequence_order);

  // Calculate horizontal position based on position field and sequence
  const getHorizontalPosition = (room: HallwayRoom) => {
    let basePosition = 0;
    if (room.position === 'start') basePosition = 10;
    else if (room.position === 'middle') basePosition = 45;
    else if (room.position === 'end') basePosition = 80;
    
    // Offset by sequence within position group (larger offset to prevent overlap)
    const offset = room.sequence_order * 8;
    return Math.min(95, basePosition + offset);
  };

  // Calculate progress percentage for each landmark
  const getLandmarkPosition = (landmark: HallwayLandmark) => {
    const midPoint = landmark.fixture_range_start && landmark.fixture_range_end
      ? (landmark.fixture_range_start + landmark.fixture_range_end) / 2
      : landmark.fixture_range_start || 0;
    return (midPoint / totalFixtures) * 100;
  };

  const currentProgress = (currentFixtureSequence / totalFixtures) * 100;

  // Determine current landmark context
  const getCurrentLandmarkContext = () => {
    if (landmarks.length === 0) return null;

    // Find landmarks that this fixture is within range of
    for (const landmark of landmarks) {
      if (landmark.fixture_range_start && landmark.fixture_range_end) {
        if (
          currentFixtureSequence >= landmark.fixture_range_start &&
          currentFixtureSequence <= landmark.fixture_range_end
        ) {
          return { type: 'at', landmark };
        }
      }
    }

    // Find landmarks before and after
    let beforeLandmark = null;
    let afterLandmark = null;

    for (const landmark of landmarks) {
      if (landmark.fixture_range_end && currentFixtureSequence > landmark.fixture_range_end) {
        beforeLandmark = landmark;
      }
      if (
        landmark.fixture_range_start &&
        currentFixtureSequence < landmark.fixture_range_start &&
        !afterLandmark
      ) {
        afterLandmark = landmark;
        break;
      }
    }

    if (beforeLandmark && afterLandmark) {
      return { type: 'between', before: beforeLandmark, after: afterLandmark };
    }

    return null;
  };

  const context = getCurrentLandmarkContext();

  return (
    <Card className="border-2 border-dashed border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
      <CardContent className="p-4 space-y-3">
        {/* Route Direction */}
        {(startReference || endReference) && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            {startReference && (
              <span className="font-medium">{startReference}</span>
            )}
            <ArrowRight className="h-4 w-4" />
            {endReference && (
              <span className="font-medium">{endReference}</span>
            )}
          </div>
        )}

        {/* Left Side Rooms */}
        <div className="relative min-h-12">
          {leftRooms.map((room) => (
            <div
              key={room.id}
              className="absolute top-0"
              style={{ left: `${getHorizontalPosition(room)}%`, transform: 'translateX(-50%)' }}
            >
              <CorridorRoomCard 
                room={room} 
                onClick={() => onRoomClick?.(room.room_id)}
              />
            </div>
          ))}
        </div>

        {/* Corridor Bar with Landmarks */}
        <div className="relative">
          {/* START/MIDDLE/END Labels */}
          <div className="absolute -top-5 left-0 right-0 text-xs font-semibold text-primary/60 uppercase tracking-wide">
            <span className="absolute left-[10%] -translate-x-1/2">Start</span>
            <span className="absolute left-[50%] -translate-x-1/2">Middle</span>
            <span className="absolute left-[80%] -translate-x-1/2">End</span>
          </div>

          {/* Visual Route Bar */}
          <div className="relative h-8 bg-primary/10 rounded-full border-2 border-primary/20">
            {/* Progress fill */}
            <div
              className="absolute inset-y-0 left-0 bg-primary/30 rounded-full transition-all duration-300"
              style={{ width: `${currentProgress}%` }}
            />

            {/* Landmark markers */}
            {landmarks.map((landmark) => (
              <div
                key={landmark.id}
                className="absolute inset-y-0 flex items-center z-20"
                style={{ left: `${getLandmarkPosition(landmark)}%` }}
              >
                <div className="relative -translate-x-1/2">
                  <CorridorLandmark 
                    landmark={landmark} 
                    onClick={() => onLandmarkClick?.(landmark.id)}
                  />
                </div>
              </div>
            ))}

            {/* Current position indicator */}
            <div
              className="absolute inset-y-0 flex items-center transition-all duration-300 z-30"
              style={{ left: `${currentProgress}%` }}
            >
              <div className="relative -translate-x-1/2">
                <MapPin className="h-6 w-6 text-primary fill-primary/50 animate-pulse drop-shadow-lg" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Rooms */}
        <div className="relative min-h-12">
          {rightRooms.map((room) => (
            <div
              key={room.id}
              className="absolute top-0"
              style={{ left: `${getHorizontalPosition(room)}%`, transform: 'translateX(-50%)' }}
            >
              <CorridorRoomCard 
                room={room} 
                onClick={() => onRoomClick?.(room.room_id)}
              />
            </div>
          ))}
        </div>

        {/* Context Text */}
        {context && (
          <div className="flex items-center justify-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {context.type === 'at' && (
                <span>Near: {context.landmark.name}</span>
              )}
              {context.type === 'between' && (
                <span>Between {context.before.name} and {context.after.name}</span>
              )}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
