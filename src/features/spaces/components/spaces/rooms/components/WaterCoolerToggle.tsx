import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Droplets, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errorUtils';
import { cn } from '@/lib/utils';
import { useRolePermissions } from '@features/auth/hooks/useRolePermissions';

interface WaterCoolerToggleProps {
  roomId: string;
  waterCoolerCount: number;
  waterCoolerNotes?: string | null;
  className?: string;
}

export function WaterCoolerToggle({
  roomId,
  waterCoolerCount,
  waterCoolerNotes,
  className,
}: WaterCoolerToggleProps) {
  const queryClient = useQueryClient();
  const { canAdmin } = useRolePermissions();
  const canManageSpaces = canAdmin('spaces');
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState(Math.max(1, waterCoolerCount));
  const [notes, setNotes] = useState(waterCoolerNotes ?? '');
  const hasWaterCooler = waterCoolerCount > 0;

  useEffect(() => {
    if (!open) {
      setQuantity(Math.max(1, waterCoolerCount));
      setNotes(waterCoolerNotes ?? '');
    }
  }, [open, waterCoolerCount, waterCoolerNotes]);

  const updateCoolers = useMutation({
    mutationFn: async (nextCount: number) => {
      const count = Math.max(0, Math.min(50, Math.trunc(nextCount)));
      const { error } = await supabase
        .from('rooms')
        .update({
          has_water_cooler: count > 0,
          water_cooler_count: count,
          water_cooler_notes: count > 0 ? notes.trim() || null : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', roomId);
      if (error) throw error;
      return count;
    },
    onSuccess: (count) => {
      toast.success(count > 0
        ? `${count} water ${count === 1 ? 'cooler' : 'coolers'} recorded`
        : 'Water coolers removed from room');
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-room', roomId] });
      setOpen(false);
    },
    onError: (error: unknown) => {
      toast.error('Failed to update water coolers', { description: getErrorMessage(error) });
    },
  });

  if (!canManageSpaces) {
    if (!hasWaterCooler) return null;
    return (
      <Badge variant="outline" className={cn('text-xs text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-800', className)}>
        <Droplets className="h-3 w-3 mr-1" />
        {waterCoolerCount} {waterCoolerCount === 1 ? 'cooler' : 'coolers'}
      </Badge>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'h-8 gap-1.5 active:scale-[0.98]',
            hasWaterCooler && 'border-sky-400/60 bg-sky-500/10 text-sky-700 dark:text-sky-300 hover:bg-sky-500/20',
            className,
          )}
          onClick={(event) => event.stopPropagation()}
          aria-label={hasWaterCooler ? `Edit ${waterCoolerCount} water coolers` : 'Add water coolers'}
          aria-pressed={hasWaterCooler}
        >
          <Droplets className="h-3.5 w-3.5" />
          {hasWaterCooler && <span className="font-mono text-xs font-semibold">{waterCoolerCount}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-72 space-y-4"
        onClick={(event) => event.stopPropagation()}
      >
        <div>
          <h4 className="font-medium">Water coolers</h4>
          <p className="mt-1 text-xs text-muted-foreground">Enter the exact number located in this room.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`water-cooler-count-${roomId}`}>Quantity</Label>
          <Input
            id={`water-cooler-count-${roomId}`}
            type="number"
            min={1}
            max={50}
            inputMode="numeric"
            className="font-mono"
            value={quantity}
            onChange={(event) => setQuantity(Number(event.target.value))}
            autoFocus
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`water-cooler-notes-${roomId}`}>Placement notes</Label>
          <Input
            id={`water-cooler-notes-${roomId}`}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Optional, e.g. outside the calendar unit"
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          {hasWaterCooler ? (
            <Button
              type="button"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              disabled={updateCoolers.isPending}
              onClick={() => updateCoolers.mutate(0)}
            >
              Remove
            </Button>
          ) : <span />}
          <Button
            type="button"
            disabled={updateCoolers.isPending || !Number.isFinite(quantity) || quantity < 1 || quantity > 50}
            onClick={() => updateCoolers.mutate(quantity)}
          >
            {updateCoolers.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
