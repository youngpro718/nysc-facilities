import {
  EnterIcon,
  HomeIcon,
  LayersIcon,
  Pencil1Icon,
  RowsIcon,
  SewingPinIcon,
  TrashIcon,
} from '@radix-ui/react-icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { WaterCoolerToggle } from '../rooms/components/WaterCoolerToggle';
import { commonAreaTypeLabel, type CommonArea, type CommonAreaType } from './types';

interface CommonAreaCardProps {
  area: CommonArea;
  canManage: boolean;
  onEdit: (area: CommonArea) => void;
  onDelete: (area: CommonArea) => void;
}

const areaIcons: Record<CommonAreaType, typeof RowsIcon> = {
  hallway: RowsIcon,
  entrance: EnterIcon,
  lobby: HomeIcon,
  mezzanine: LayersIcon,
  waiting_area: SewingPinIcon,
  other: SewingPinIcon,
};

export function CommonAreaCard({ area, canManage, onEdit, onDelete }: CommonAreaCardProps) {
  const AreaIcon = areaIcons[area.area_type];

  return (
    <article className="group grid gap-4 border-b border-border/70 py-4 first:pt-2 last:border-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="flex min-w-0 items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-muted/40 text-muted-foreground">
          <AreaIcon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-medium tracking-tight">{area.name}</h4>
            <Badge variant="outline" className="font-normal">
              {commonAreaTypeLabel(area.area_type)}
            </Badge>
            {area.status !== 'active' && (
              <Badge variant="secondary" className="font-normal capitalize">
                {area.status.replace('_', ' ')}
              </Badge>
            )}
          </div>
          {area.description && (
            <p className="mt-1 max-w-[70ch] text-sm leading-relaxed text-muted-foreground">
              {area.description}
            </p>
          )}
          {area.water_cooler_notes && (
            <p className="mt-1 text-xs text-sky-700 dark:text-sky-300">
              Cooler placement: {area.water_cooler_notes}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 pl-12 sm:pl-0">
        <WaterCoolerToggle
          commonAreaId={area.id}
          waterCoolerCount={area.water_cooler_count}
          waterCoolerNotes={area.water_cooler_notes}
          locationLabel="common area"
        />
        {canManage && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn('h-8 w-8 text-muted-foreground active:scale-[0.98]')}
              onClick={() => onEdit(area)}
              aria-label={`Edit ${area.name}`}
            >
              <Pencil1Icon className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive active:scale-[0.98]"
              onClick={() => onDelete(area)}
              aria-label={`Delete ${area.name}`}
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </article>
  );
}
