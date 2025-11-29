import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, ArrowRight, ArrowUpDown, TrendingUp, DoorOpen, GitBranch, DoorClosed, MapPinned } from 'lucide-react';
import { HallwayLandmark } from '@/hooks/useHallwayLandmarks';
import { HallwayRoom } from '@/hooks/useHallwayRooms';

interface RouteProgressIndicatorProps {
  landmarks: HallwayLandmark[];
  hallwayRooms: HallwayRoom[];
  currentFixtureSequence: number;
  totalFixtures: number;
  startReference?: string | null;
  endReference?: string | null;
}

export function RouteProgressIndicator({
  landmarks,
  hallwayRooms,
  currentFixtureSequence,
  totalFixtures,
  startReference,
  endReference,
}: RouteProgressIndicatorProps) {
  // Group rooms by position
  const roomsByPosition = {
    start: hallwayRooms.filter(r => r.position === 'start'),
    middle: hallwayRooms.filter(r => r.position === 'middle'),
    end: hallwayRooms.filter(r => r.position === 'end'),
  };
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

  // Calculate progress percentage for each landmark
  const getLandmarkPosition = (landmark: HallwayLandmark) => {
    const midPoint = landmark.fixture_range_start && landmark.fixture_range_end
      ? (landmark.fixture_range_start + landmark.fixture_range_end) / 2
      : landmark.fixture_range_start || 0;
    return (midPoint / totalFixtures) * 100;
  };

  const currentProgress = (currentFixtureSequence / totalFixtures) * 100;

  const getLandmarkIcon = (type: HallwayLandmark['type']) => {
    switch (type) {
      case 'elevator_bank':
        return <ArrowUpDown className="h-4 w-4 text-blue-500" />;
      case 'stairwell':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'entrance':
        return <DoorOpen className="h-4 w-4 text-orange-500" />;
      case 'intersection':
        return <GitBranch className="h-4 w-4 text-purple-500" />;
      case 'room':
        return <DoorClosed className="h-4 w-4 text-muted-foreground" />;
      default:
        return <MapPinned className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getRoomIcon = (room: HallwayRoom) => {
    const ceiling = room.room.ceiling_height === 'high' ? '🔺' : 
                    room.room.ceiling_height === 'double_height' ? '🏔️' : '⬜';
    const bulb = room.room.primary_bulb_type === 'LED' ? '💡' : 
                 room.room.primary_bulb_type === 'Fluorescent' ? '🔆' : '🔄';
    return `${ceiling}${bulb}`;
  };

  return (
    <Card className="bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
      <CardContent className="p-4 space-y-4">
        {/* Room badges by position */}
        {(roomsByPosition.start.length > 0 || roomsByPosition.middle.length > 0 || roomsByPosition.end.length > 0) && (
          <div className="grid grid-cols-3 gap-2 text-xs">
            {/* Start rooms */}
            <div className="space-y-1">
              <div className="text-slate-600 dark:text-slate-400 font-semibold text-xs uppercase tracking-wide">START</div>
              {roomsByPosition.start.map(room => (
                <Badge key={room.id} variant="outline" className="text-xs block truncate bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600">
                  {getRoomIcon(room)} {room.room.room_number}
                </Badge>
              ))}
            </div>

            {/* Middle rooms */}
            <div className="space-y-1">
              <div className="text-slate-600 dark:text-slate-400 font-semibold text-xs uppercase tracking-wide">MIDDLE</div>
              {roomsByPosition.middle.map(room => (
                <Badge key={room.id} variant="outline" className="text-xs block truncate bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600">
                  {getRoomIcon(room)} {room.room.room_number}
                </Badge>
              ))}
            </div>

            {/* End rooms */}
            <div className="space-y-1">
              <div className="text-slate-600 dark:text-slate-400 font-semibold text-xs uppercase tracking-wide">END</div>
              {roomsByPosition.end.map(room => (
                <Badge key={room.id} variant="outline" className="text-xs block truncate bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600">
                  {getRoomIcon(room)} {room.room.room_number}
                </Badge>
              ))}
            </div>
          </div>
        )}
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

        {/* Visual Route Bar */}
        <div className="relative h-12 bg-slate-200 dark:bg-slate-800 rounded-full border border-slate-300 dark:border-slate-600">
          {/* Progress fill */}
          <div
            className="absolute inset-y-0 left-0 bg-primary/40 transition-all duration-300"
            style={{ width: `${currentProgress}%` }}
          />

          {/* Landmark markers */}
          {landmarks.map((landmark) => (
            <div
              key={landmark.id}
              className="absolute inset-y-0 flex items-center"
              style={{ left: `${getLandmarkPosition(landmark)}%` }}
            >
              <div className="relative -translate-x-1/2">
                <div className="p-1.5 rounded-full bg-white dark:bg-slate-800 shadow-md border-2 border-slate-300 dark:border-slate-500">
                  {getLandmarkIcon(landmark.type)}
                </div>
                <div className="absolute top-full mt-1 text-xs font-medium text-slate-700 dark:text-slate-300 max-w-[80px] text-center -translate-x-1/2 left-1/2 truncate">
                  {landmark.name}
                </div>
              </div>
            </div>
          ))}

          {/* Current position indicator */}
          <div
            className="absolute inset-y-0 flex items-center transition-all duration-300 z-10"
            style={{ left: `${currentProgress}%` }}
          >
            <div className="relative -translate-x-1/2">
              <MapPin className="h-7 w-7 text-blue-600 fill-blue-500 animate-pulse drop-shadow-lg" />
            </div>
          </div>
        </div>

        {/* Context Text */}
        {context && (
          <div className="flex items-center justify-center gap-2">
            <Badge variant="secondary" className="text-xs flex items-center gap-1.5">
              {context.type === 'at' && (
                <>
                  {getLandmarkIcon(context.landmark.type)}
                  <span>Near: {context.landmark.name}</span>
                </>
              )}
              {context.type === 'between' && (
                <>
                  {getLandmarkIcon(context.before.type)}
                  <span>Between {context.before.name} and {context.after.name}</span>
                  {getLandmarkIcon(context.after.type)}
                </>
              )}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
