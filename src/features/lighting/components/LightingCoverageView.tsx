import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, Building2, Flame } from 'lucide-react';
import {
  listRoomsWithLightingProfiles,
  getFloorHeatmap,
  computeBuildingCoverage,
} from '@features/lighting/services/roomLightingProfileService';

/**
 * Coverage tab — two stacked sections:
 *   1. LED conversion progress per building (% led, breakdown).
 *   2. Floor heatmap — issues per floor in the last 90 days, sorted hottest first.
 */
export function LightingCoverageView() {
  const { data: rooms = [], isLoading: roomsLoading } = useQuery({
    queryKey: ['rooms-with-lighting-profiles'],
    queryFn: listRoomsWithLightingProfiles,
  });
  const { data: heatmap = [], isLoading: heatLoading } = useQuery({
    queryKey: ['lighting-floor-heatmap'],
    queryFn: getFloorHeatmap,
  });

  const coverage = useMemo(() => computeBuildingCoverage(rooms), [rooms]);
  const maxTotal = Math.max(1, ...heatmap.map((h) => h.total_90d));

  return (
    <div className="space-y-6">
      {/* LED conversion */}
      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-amber-400" />
            <h4 className="text-sm font-semibold">LED conversion progress</h4>
          </div>
          {roomsLoading ? (
            <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading rooms…
            </div>
          ) : coverage.length === 0 ? (
            <p className="text-sm text-muted-foreground">No rooms with profiles yet — reports will start populating this.</p>
          ) : (
            <div className="space-y-3">
              {coverage.map((b) => (
                <div key={b.building_id ?? 'unassigned'} className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-medium text-sm">{b.building_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {b.rooms_led} of {b.total_rooms} converted · {b.led_percent}%
                    </span>
                  </div>
                  <Progress value={b.led_percent} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {b.total_rooms_with_profile} profiled · {b.rooms_other_known} non-LED known · {b.total_rooms - b.total_rooms_with_profile} unprofiled
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Floor heatmap */}
      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-red-400" />
            <h4 className="text-sm font-semibold">Floor heatmap — last 90 days</h4>
          </div>
          {heatLoading ? (
            <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : heatmap.length === 0 ? (
            <p className="text-sm text-muted-foreground">No lighting issues reported in the last 90 days.</p>
          ) : (
            <div className="space-y-2">
              {heatmap.map((row) => {
                const ratio = row.total_90d / maxTotal;
                return (
                  <div key={row.floor_id} className="space-y-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm">
                        <span className="font-medium">{row.floor_name}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{row.building_name}</span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {row.open_count} open · {row.resolved_90d_count} resolved
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted/50">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.max(4, ratio * 100)}%`,
                          background: row.open_count > 0
                            ? `linear-gradient(90deg, rgba(248,113,113,${0.4 + ratio * 0.5}), rgba(251,146,60,${0.4 + ratio * 0.5}))`
                            : 'rgba(74,222,128,0.4)',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
