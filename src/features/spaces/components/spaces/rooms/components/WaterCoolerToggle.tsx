/**
 * WaterCoolerToggle Component
 *
 * Room-card control for tracking water coolers. Facilities is supposed to
 * have a cooler in every room but only has them in certain sections — this
 * marks which rooms have one so the Spaces directory can answer "where are
 * all the coolers?" via the Water Coolers quick filter.
 *
 * Space managers get a click-to-toggle button; everyone else sees a
 * read-only badge when a cooler is present.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Droplets } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errorUtils';
import { cn } from '@/lib/utils';
import { useRolePermissions } from '@features/auth/hooks/useRolePermissions';

interface WaterCoolerToggleProps {
  roomId: string;
  hasWaterCooler: boolean;
  /** 'button' renders the toggle (managers); 'badge' renders read-only. */
  className?: string;
}

export function WaterCoolerToggle({ roomId, hasWaterCooler, className }: WaterCoolerToggleProps) {
  const queryClient = useQueryClient();
  const { canAdmin } = useRolePermissions();
  const canManageSpaces = canAdmin('spaces');

  const toggle = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('rooms')
        .update({ has_water_cooler: !hasWaterCooler, updated_at: new Date().toISOString() })
        .eq('id', roomId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(hasWaterCooler ? 'Water cooler removed from room' : 'Water cooler marked in room');
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
    onError: (error: unknown) => {
      toast.error('Failed to update water cooler', { description: getErrorMessage(error) });
    },
  });

  if (!canManageSpaces) {
    // Read-only: only show when there IS a cooler; absence isn't worth pixels.
    if (!hasWaterCooler) return null;
    return (
      <Badge variant="outline" className={cn('text-xs text-sky-600 dark:text-sky-400 border-sky-300 dark:border-sky-800', className)}>
        <Droplets className="h-3 w-3 mr-1" />
        Water cooler
      </Badge>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'h-8',
            hasWaterCooler && 'border-sky-400/60 bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20',
            className,
          )}
          disabled={toggle.isPending}
          onClick={(e) => {
            e.stopPropagation();
            toggle.mutate();
          }}
          aria-label={hasWaterCooler ? 'Mark water cooler removed' : 'Mark room has water cooler'}
          aria-pressed={hasWaterCooler}
        >
          <Droplets className="h-3.5 w-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {hasWaterCooler ? 'Water cooler in room — click to mark removed' : 'No water cooler — click to mark one here'}
      </TooltipContent>
    </Tooltip>
  );
}
