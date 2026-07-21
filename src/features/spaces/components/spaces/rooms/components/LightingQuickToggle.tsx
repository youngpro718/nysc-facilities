import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Lightbulb, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errorUtils';
import { cn } from '@/lib/utils';
import { useSpaceFixtures, useUpdateFixtureStatus, lightingKeys } from '@features/lighting/hooks/useLightingData';
import { createFixture as createFixtureRequest, nextFixtureLabels, type LightStatus, type LightingType } from '@features/lighting/services/lightingService';

interface LightingQuickToggleProps {
  roomId: string;
  floorId?: string;
  buildingId?: string;
  className?: string;
}

export function LightingQuickToggle({ roomId, floorId, buildingId, className }: LightingQuickToggleProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const { data: fixtures = [], isLoading } = useSpaceFixtures(roomId, 'room');
  const updateStatus = useUpdateFixtureStatus();

  const outCount = fixtures.filter((f) => f.status && f.status !== 'functional').length;
  const sorted = [...fixtures].sort((a, b) =>
    (a.name || '').localeCompare(b.name || '', undefined, { numeric: true })
  );

  const toggleFixture = async (fixtureId: string, currentStatus: LightStatus) => {
    setBusyId(fixtureId);
    try {
      await updateStatus.mutateAsync({
        fixtureId,
        payload: {
          status: currentStatus === 'functional' ? 'non_functional' : 'functional',
          resolved_at: currentStatus !== 'functional' ? new Date().toISOString() : undefined,
        },
      });
    } catch (err) {
      toast.error(`Update failed: ${getErrorMessage(err)}`);
    } finally {
      setBusyId(null);
    }
  };

  const setupFixtures = useMutation({
    mutationFn: async (count: number) => {
      const labels = nextFixtureLabels(fixtures.map((f) => f.name), count);
      for (const label of labels) {
        await createFixtureRequest({
          name: label,
          type: 'standard' as LightingType,
          status: 'functional',
          position: 'ceiling',
          bulb_count: 1,
          space_id: roomId,
          space_type: 'room',
          floor_id: floorId,
          building_id: buildingId,
        });
      }
      return labels;
    },
    onSuccess: (labels) => {
      queryClient.invalidateQueries({ queryKey: lightingKeys.fixturesBySpace(roomId, 'room') });
      queryClient.invalidateQueries({ queryKey: lightingKeys.fixtures() });
      toast.success(`Added ${labels.length} fixture${labels.length === 1 ? '' : 's'}`);
    },
    onError: (err) => {
      toast.error(`Setup failed: ${getErrorMessage(err)}`);
    },
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'h-8 gap-1.5 active:scale-[0.98]',
            outCount > 0 && 'border-amber-400/60 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20',
            className,
          )}
          onClick={(event) => event.stopPropagation()}
          aria-label={outCount > 0 ? `${outCount} lights out — report or manage` : 'Lighting status'}
        >
          <Lightbulb className="h-3.5 w-3.5" />
          {outCount > 0 && <span className="font-mono text-xs font-semibold">{outCount}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 space-y-3"
        onClick={(event) => event.stopPropagation()}
      >
        <div>
          <h4 className="font-medium">Lighting fixtures</h4>
          <p className="mt-1 text-xs text-muted-foreground">Tap a fixture to flag it out or mark it fixed.</p>
        </div>

        {isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : sorted.length === 0 ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              No fixtures tracked yet in this room. Set them up once, then reporting is one tap.
            </p>
            <div className="flex flex-wrap gap-2">
              {[4, 6, 8].map((n) => (
                <Button
                  key={n}
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={setupFixtures.isPending}
                  onClick={() => setupFixtures.mutate(n)}
                >
                  {setupFixtures.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                  Add {n} fixtures
                </Button>
              ))}
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={setupFixtures.isPending}
                onClick={() => setupFixtures.mutate(1)}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Just one
              </Button>
            </div>
          </div>
        ) : (
          <ul className="space-y-1.5 max-h-64 overflow-y-auto">
            {sorted.map((f) => {
              const isOut = !!f.status && f.status !== 'functional';
              return (
                <li key={f.id} className="flex items-center justify-between gap-2 rounded-md border bg-card px-2.5 py-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge variant="outline" className="font-mono shrink-0">{f.name}</Badge>
                    {isOut && (
                      <span className="text-xs text-amber-700 dark:text-amber-400 truncate">
                        {f.status === 'maintenance_needed' ? 'Needs maintenance' : 'Out'}
                      </span>
                    )}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant={isOut ? 'outline' : 'destructive'}
                    className="h-7 text-xs shrink-0"
                    disabled={busyId === f.id}
                    onClick={() => toggleFixture(f.id, (f.status ?? 'functional') as LightStatus)}
                  >
                    {busyId === f.id && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                    {isOut ? 'Mark fixed' : 'Mark out'}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
