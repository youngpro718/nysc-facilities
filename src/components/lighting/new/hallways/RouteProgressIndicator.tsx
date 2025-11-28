import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, ArrowRight } from 'lucide-react';
import { HallwayLandmark } from '@/hooks/useHallwayLandmarks';

interface RouteProgressIndicatorProps {
  landmarks: HallwayLandmark[];
  currentFixtureSequence: number;
  totalFixtures: number;
  startReference?: string | null;
  endReference?: string | null;
}

export function RouteProgressIndicator({
  landmarks,
  currentFixtureSequence,
  totalFixtures,
  startReference,
  endReference,
}: RouteProgressIndicatorProps) {
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

  return (
    <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
      <CardContent className="p-4 space-y-4">
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
        <div className="relative h-12 bg-background/50 rounded-full overflow-hidden">
          {/* Progress fill */}
          <div
            className="absolute inset-y-0 left-0 bg-primary/20 transition-all duration-300"
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
                <div className="w-2 h-2 rounded-full bg-border" />
                <div className="absolute top-full mt-1 text-xs text-muted-foreground whitespace-nowrap -translate-x-1/2 left-1/2">
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
              <MapPin className="h-6 w-6 text-primary fill-primary animate-pulse" />
            </div>
          </div>
        </div>

        {/* Context Text */}
        {context && (
          <div className="flex items-center justify-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {context.type === 'at' && (
                <>Near: {context.landmark.name}</>
              )}
              {context.type === 'between' && (
                <>Between {context.before.name} and {context.after.name}</>
              )}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
